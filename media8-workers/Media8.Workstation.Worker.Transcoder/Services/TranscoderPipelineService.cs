using System.Diagnostics;
using Media8.Workstation.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Media8.Workstation.Worker.Transcoder.Services;

public class TranscoderPipelineResult
{
    public bool Success { get; set; }
    public string? ProxyPath { get; set; }
    public string? WaveformJsonPath { get; set; }
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

        var storageBaseDir = configuration["STORAGE_PATH"]
            ?? (Directory.Exists("/storage") ? "/storage" : Path.Combine(Directory.GetCurrentDirectory(), "storage"));
        
        var proxyDir = Path.Combine(storageBaseDir, "proxy", asset.ProjectId.ToString());
        if (!Directory.Exists(proxyDir))
        {
            Directory.CreateDirectory(proxyDir);
        }

        var mimeType = asset.MimeType.ToLowerInvariant();
        var fileName = Path.GetFileNameWithoutExtension(rawFilePath);

        try
        {
            // 1. Extração de Metadados via FFprobe
            result.Metadata = await ffprobeService.ExtractMetadataAsync(rawFilePath, cancellationToken);

            if (mimeType.StartsWith("video/"))
            {
                logger.LogInformation("[TranscoderPipelineService] Processando Vídeo Proxy para Asset {AssetId}...", asset.AssetId);

                var proxyMp4Path = Path.Combine(proxyDir, $"{asset.AssetId}_proxy.mp4");
                var posterWebpPath = Path.Combine(proxyDir, $"{asset.AssetId}_poster.webp");
                var waveformJsonPath = Path.Combine(proxyDir, $"{asset.AssetId}_waveform.json");

                // Geração de Vídeo Proxy MP4 H.264 720p com +faststart
                using var videoProcess = new Process();
                videoProcess.StartInfo.FileName = "ffmpeg";
                videoProcess.StartInfo.Arguments = $"-y -i \"{rawFilePath}\" -vf \"scale='min(1280,iw)':-2\" -c:v libx264 -preset fast -crf 26 -pix_fmt yuv420p -movflags +faststart -c:a aac -b:a 128k \"{proxyMp4Path}\"";
                videoProcess.StartInfo.UseShellExecute = false;
                videoProcess.StartInfo.CreateNoWindow = true;

                videoProcess.Start();
                await videoProcess.WaitForExitAsync(cancellationToken);

                result.ProxyPath = proxyMp4Path;

                // Geração de Poster Thumbnail WebP no frame de 1s
                using var posterProcess = new Process();
                posterProcess.StartInfo.FileName = "ffmpeg";
                posterProcess.StartInfo.Arguments = $"-y -ss 00:00:01 -i \"{rawFilePath}\" -vframes 1 -vf \"scale='min(1280,iw)':-2\" -c:v libwebp -q:v 80 \"{posterWebpPath}\"";
                posterProcess.StartInfo.UseShellExecute = false;
                posterProcess.StartInfo.CreateNoWindow = true;

                posterProcess.Start();
                await posterProcess.WaitForExitAsync(cancellationToken);

                // Extração do Waveform de Áudio (20 pps, escala 0..100)
                result.WaveformJsonPath = await waveformExtractorService.ExtractWaveformAsync(
                    asset.AssetId,
                    rawFilePath,
                    waveformJsonPath,
                    result.Metadata.DurationSeconds,
                    cancellationToken);

                result.Success = true;
            }
            else if (mimeType.StartsWith("audio/"))
            {
                logger.LogInformation("[TranscoderPipelineService] Processando Áudio Proxy para Asset {AssetId}...", asset.AssetId);

                var proxyAacPath = Path.Combine(proxyDir, $"{asset.AssetId}_proxy.aac");
                var waveformJsonPath = Path.Combine(proxyDir, $"{asset.AssetId}_waveform.json");

                // Conversão em Áudio Proxy AAC 192k
                using var audioProcess = new Process();
                audioProcess.StartInfo.FileName = "ffmpeg";
                audioProcess.StartInfo.Arguments = $"-y -i \"{rawFilePath}\" -c:a aac -b:a 192k \"{proxyAacPath}\"";
                audioProcess.StartInfo.UseShellExecute = false;
                audioProcess.StartInfo.CreateNoWindow = true;

                audioProcess.Start();
                await audioProcess.WaitForExitAsync(cancellationToken);

                result.ProxyPath = proxyAacPath;

                // Extração do Waveform de Áudio (20 pps, escala 0..100)
                result.WaveformJsonPath = await waveformExtractorService.ExtractWaveformAsync(
                    asset.AssetId,
                    rawFilePath,
                    waveformJsonPath,
                    result.Metadata.DurationSeconds,
                    cancellationToken);

                result.Success = true;
            }
            else if (mimeType.StartsWith("image/"))
            {
                logger.LogInformation("[TranscoderPipelineService] Processando Imagem Proxy WebP para Asset {AssetId}...", asset.AssetId);

                var proxyWebpPath = Path.Combine(proxyDir, $"{asset.AssetId}_proxy.webp");

                // Redimensionamento e otimização para WebP 1080p
                using var imgProcess = new Process();
                imgProcess.StartInfo.FileName = "ffmpeg";
                imgProcess.StartInfo.Arguments = $"-y -i \"{rawFilePath}\" -vf \"scale='min(1920,iw)':min'(1080,ih)':force_original_aspect_ratio=decrease\" -c:v libwebp -q:v 85 \"{proxyWebpPath}\"";
                imgProcess.StartInfo.UseShellExecute = false;
                imgProcess.StartInfo.CreateNoWindow = true;

                imgProcess.Start();
                await imgProcess.WaitForExitAsync(cancellationToken);

                result.ProxyPath = proxyWebpPath;
                result.Success = true;
            }
            else
            {
                logger.LogInformation("[TranscoderPipelineService] Extraindo Texto de Documento para Markdown para Asset {AssetId}...", asset.AssetId);

                var rawDir = Path.GetDirectoryName(rawFilePath) ?? proxyDir;
                var markdownExtractedPath = Path.Combine(rawDir, $"{asset.AssetId}_extracted.md");

                result.ProxyPath = await documentTextExtractorService.ExtractDocumentToMarkdownAsync(
                    rawFilePath,
                    markdownExtractedPath,
                    cancellationToken);

                result.Success = true;
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
