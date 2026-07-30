using System.Diagnostics;
using Media8.Workstation.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Media8.Workstation.Worker.Transcoder.Services;

public class TranscoderPipelineResult
{
    public bool Success { get; set; }
    public string? HighFidelityPath { get; set; }
    public string? ProxyPath { get; set; }
    public string? WaveformJsonPath { get; set; }
    public long FileSizeBytesRaw { get; set; }
    public long FileSizeBytesHighFidelity { get; set; }
    public long FileSizeBytesProxy { get; set; }
    public FFprobeMetadataResult Metadata { get; set; } = new();
    public string? ErrorMessage { get; set; }
}

public class TranscoderPipelineService(
    ILogger<TranscoderPipelineService> logger,
    IConfiguration configuration,
    FFprobeService ffprobeService,
    WaveformExtractorService waveformExtractorService,
    DocumentTextExtractorService documentTextExtractorService)
{
    public async Task<TranscoderPipelineResult> ProcessAssetAsync(
        WorkstationAsset asset,
        string rawFilePath,
        CancellationToken cancellationToken = default)
    {
        var result = new TranscoderPipelineResult();

        if (!File.Exists(rawFilePath))
        {
            result.ErrorMessage = $"Arquivo bruto não encontrado: {rawFilePath}";
            logger.LogError("[TranscoderPipelineService] {ErrorMessage}", result.ErrorMessage);
            return result;
        }

        // Mede tamanho do arquivo bruto (RAW) antes de qualquer conversão
        result.FileSizeBytesRaw = new FileInfo(rawFilePath).Length;

        var storageBaseDir = configuration["STORAGE_PATH"]
            ?? (Directory.Exists("/storage") ? "/storage" : Path.Combine(Directory.GetCurrentDirectory(), "storage"));

        var projectIdStr = asset.ProjectId.ToString();
        var hfDir = Path.Combine(storageBaseDir, "high-fidelity", projectIdStr);
        var proxiesDir = Path.Combine(storageBaseDir, "proxies", projectIdStr);
        var waveformsDir = Path.Combine(storageBaseDir, "waveforms", projectIdStr);

        Directory.CreateDirectory(hfDir);
        Directory.CreateDirectory(proxiesDir);
        Directory.CreateDirectory(waveformsDir);

        var mimeType = (asset.MimeType ?? string.Empty).ToLowerInvariant();
        var ext = Path.GetExtension(rawFilePath).ToLowerInvariant();

        bool isDocument = ext is ".pdf" or ".txt" or ".doc" or ".docx" or ".json" or ".md" or ".csv" or ".xml"
            || mimeType.Contains("pdf") || mimeType.StartsWith("text/") || mimeType.Contains("document");

        try
        {
            if (isDocument)
            {
                logger.LogInformation("[TranscoderPipelineService] Processando Documento ({Ext}) para Markdown para Asset {AssetId}...", ext, asset.AssetId);

                var hfDocPath = Path.Combine(hfDir, $"{asset.AssetId}_hf{ext}");
                File.Copy(rawFilePath, hfDocPath, overwrite: true);
                result.HighFidelityPath = hfDocPath;

                var markdownPath = Path.Combine(proxiesDir, $"{asset.AssetId}_extracted.md");
                result.ProxyPath = await documentTextExtractorService.ExtractDocumentToMarkdownAsync(
                    rawFilePath,
                    markdownPath,
                    cancellationToken);

                result.Success = true;
            }
            else
            {
                // Extração de Metadados Técnicos via FFprobe apenas para Mídias Audiovisuais
                result.Metadata = await ffprobeService.ExtractMetadataAsync(rawFilePath, cancellationToken);

                if (mimeType.StartsWith("video/") || ext is ".mp4" or ".mov" or ".mkv" or ".avi" or ".webm")
                {
                    logger.LogInformation("[TranscoderPipelineService] Processando Vídeo (High-Fidelity + Proxy + Waveform) para Asset {AssetId}...", asset.AssetId);

                    var hfMp4Path = Path.Combine(hfDir, $"{asset.AssetId}_hf.mp4");
                    var proxyMp4Path = Path.Combine(proxiesDir, $"{asset.AssetId}_proxy.mp4");
                    var posterWebpPath = Path.Combine(proxiesDir, $"{asset.AssetId}_poster.webp");
                    var waveformJsonPath = Path.Combine(waveformsDir, $"{asset.AssetId}_waveform.json");

                    // Etapa 1: Geração do High-Fidelity Master (CRF 18 ~ alta qualidade mantendo resolução nativa)
                    using var hfProcess = new Process();
                    hfProcess.StartInfo.FileName = "ffmpeg";
                    hfProcess.StartInfo.Arguments = $"-y -i \"{rawFilePath}\" -c:v libx264 -preset medium -crf 18 -c:a aac -b:a 256k \"{hfMp4Path}\"";
                    hfProcess.StartInfo.UseShellExecute = false;
                    hfProcess.StartInfo.CreateNoWindow = true;

                    hfProcess.Start();
                    await hfProcess.WaitForExitAsync(cancellationToken);

                    result.HighFidelityPath = hfMp4Path;

                    // Etapa 2: Geração do Proxy Web (720p 1Mbps H.264 FastStart)
                    using var proxyProcess = new Process();
                    proxyProcess.StartInfo.FileName = "ffmpeg";
                    proxyProcess.StartInfo.Arguments = $"-y -i \"{rawFilePath}\" -vf \"scale='min(1280,iw)':-2\" -c:v libx264 -preset fast -crf 26 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k \"{proxyMp4Path}\"";
                    proxyProcess.StartInfo.UseShellExecute = false;
                    proxyProcess.StartInfo.CreateNoWindow = true;

                    proxyProcess.Start();
                    await proxyProcess.WaitForExitAsync(cancellationToken);

                    result.ProxyPath = proxyMp4Path;

                    // Poster WebP (frame 1s)
                    using var posterProcess = new Process();
                    posterProcess.StartInfo.FileName = "ffmpeg";
                    posterProcess.StartInfo.Arguments = $"-y -ss 00:00:01 -i \"{rawFilePath}\" -vframes 1 -vf \"scale='min(1280,iw)':-2\" -c:v libwebp -q:v 80 \"{posterWebpPath}\"";
                    posterProcess.StartInfo.UseShellExecute = false;
                    posterProcess.StartInfo.CreateNoWindow = true;

                    posterProcess.Start();
                    await posterProcess.WaitForExitAsync(cancellationToken);

                    // Etapa 3: Waveform 20 pps a partir do PROXY LEVE
                    result.WaveformJsonPath = await waveformExtractorService.ExtractWaveformAsync(
                        asset.AssetId,
                        proxyMp4Path,
                        waveformJsonPath,
                        result.Metadata.DurationSeconds,
                        cancellationToken);

                    result.Success = true;
                }
                else if (mimeType.StartsWith("audio/") || ext is ".mp3" or ".wav" or ".aac" or ".flac" or ".m4a" or ".ogg")
                {
                    logger.LogInformation("[TranscoderPipelineService] Processando Áudio (High-Fidelity + Proxy + Waveform) para Asset {AssetId}...", asset.AssetId);

                    var hfAacPath = Path.Combine(hfDir, $"{asset.AssetId}_hf.aac");
                    var proxyAacPath = Path.Combine(proxiesDir, $"{asset.AssetId}_proxy.aac");
                    var waveformJsonPath = Path.Combine(waveformsDir, $"{asset.AssetId}_waveform.json");

                    // Master High-Fidelity 320k
                    using var hfProcess = new Process();
                    hfProcess.StartInfo.FileName = "ffmpeg";
                    hfProcess.StartInfo.Arguments = $"-y -i \"{rawFilePath}\" -c:a aac -b:a 320k \"{hfAacPath}\"";
                    hfProcess.StartInfo.UseShellExecute = false;
                    hfProcess.StartInfo.CreateNoWindow = true;

                    hfProcess.Start();
                    await hfProcess.WaitForExitAsync(cancellationToken);

                    result.HighFidelityPath = hfAacPath;

                    // Proxy AAC 128k
                    using var proxyProcess = new Process();
                    proxyProcess.StartInfo.FileName = "ffmpeg";
                    proxyProcess.StartInfo.Arguments = $"-y -i \"{rawFilePath}\" -c:a aac -b:a 128k \"{proxyAacPath}\"";
                    proxyProcess.StartInfo.UseShellExecute = false;
                    proxyProcess.StartInfo.CreateNoWindow = true;

                    proxyProcess.Start();
                    await proxyProcess.WaitForExitAsync(cancellationToken);

                    result.ProxyPath = proxyAacPath;

                    // Waveform 20 pps a partir do PROXY LEVE
                    result.WaveformJsonPath = await waveformExtractorService.ExtractWaveformAsync(
                        asset.AssetId,
                        proxyAacPath,
                        waveformJsonPath,
                        result.Metadata.DurationSeconds,
                        cancellationToken);

                    result.Success = true;
                }
                else
                {
                    logger.LogInformation("[TranscoderPipelineService] Processando Imagem (High-Fidelity + Proxy) para Asset {AssetId}...", asset.AssetId);

                    var hfWebpPath = Path.Combine(hfDir, $"{asset.AssetId}_hf.webp");
                    var proxyWebpPath = Path.Combine(proxiesDir, $"{asset.AssetId}_proxy.webp");

                    // Master High-Fidelity WebP 95%
                    using var hfProcess = new Process();
                    hfProcess.StartInfo.FileName = "ffmpeg";
                    hfProcess.StartInfo.Arguments = $"-y -i \"{rawFilePath}\" -c:v libwebp -q:v 95 \"{hfWebpPath}\"";
                    hfProcess.StartInfo.UseShellExecute = false;
                    hfProcess.StartInfo.CreateNoWindow = true;

                    hfProcess.Start();
                    await hfProcess.WaitForExitAsync(cancellationToken);

                    result.HighFidelityPath = hfWebpPath;

                    // Proxy WebP 1080p
                    using var proxyProcess = new Process();
                    proxyProcess.StartInfo.FileName = "ffmpeg";
                    proxyProcess.StartInfo.Arguments = $"-y -i \"{rawFilePath}\" -vf \"scale='min(1920,iw)':min'(1080,ih)':force_original_aspect_ratio=decrease\" -c:v libwebp -q:v 85 \"{proxyWebpPath}\"";
                    proxyProcess.StartInfo.UseShellExecute = false;
                    proxyProcess.StartInfo.CreateNoWindow = true;

                    proxyProcess.Start();
                    await proxyProcess.WaitForExitAsync(cancellationToken);

                    result.ProxyPath = proxyWebpPath;
                    result.Success = true;
                }
            }

            // Calcula métricas exatas de tamanho de arquivos gerados em bytes
            if (!string.IsNullOrEmpty(result.HighFidelityPath) && File.Exists(result.HighFidelityPath))
            {
                result.FileSizeBytesHighFidelity = new FileInfo(result.HighFidelityPath).Length;
            }

            if (!string.IsNullOrEmpty(result.ProxyPath) && File.Exists(result.ProxyPath))
            {
                result.FileSizeBytesProxy = new FileInfo(result.ProxyPath).Length;
            }

            // Purga / Exclusão do Arquivo RAW Físico temporário após conclusão bem-sucedida!
            if (result.Success && File.Exists(rawFilePath))
            {
                try
                {
                    File.Delete(rawFilePath);
                    logger.LogInformation("[TranscoderPipelineService] 🗑️ Arquivo RAW temporário purgado com sucesso: {RawFilePath}", rawFilePath);

                    var rawDir = Path.GetDirectoryName(rawFilePath);
                    if (!string.IsNullOrEmpty(rawDir) && Directory.Exists(rawDir) && Directory.GetFileSystemEntries(rawDir).Length == 0)
                    {
                        Directory.Delete(rawDir);
                        logger.LogInformation("[TranscoderPipelineService] 🗑️ Diretório RAW do projeto removido por estar vazio: {RawDir}", rawDir);
                    }
                }
                catch (Exception purgeEx)
                {
                    logger.LogWarning(purgeEx, "[TranscoderPipelineService] Falha não crítica ao purgar arquivo RAW {RawFilePath}", rawFilePath);
                }
            }
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.ErrorMessage = ex.Message;
            logger.LogError(ex, "[TranscoderPipelineService] Erro ao transcodificar Asset {AssetId}", asset.AssetId);
        }

        return result;
    }
}
