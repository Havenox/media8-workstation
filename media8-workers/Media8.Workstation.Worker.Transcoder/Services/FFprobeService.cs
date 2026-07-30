using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace Media8.Workstation.Worker.Transcoder.Services;

public class FFprobeMetadataResult
{
    public double DurationSeconds { get; set; } = 0.0;
    public int Width { get; set; } = 0;
    public int Height { get; set; } = 0;
    public double FrameRate { get; set; } = 29.97;
    public int AudioChannels { get; set; } = 2;
    public string TimecodeStart { get; set; } = "00:00:00:00";
}

public class FFprobeService(ILogger<FFprobeService> logger)
{
    public async Task<FFprobeMetadataResult> ExtractMetadataAsync(string filePath, CancellationToken cancellationToken = default)
    {
        var result = new FFprobeMetadataResult();

        if (!File.Exists(filePath))
        {
            logger.LogWarning("[FFprobeService] Arquivo não encontrado: {FilePath}", filePath);
            return result;
        }

        try
        {
            using var process = new Process();
            process.StartInfo.FileName = "ffprobe";
            process.StartInfo.Arguments = $"-v quiet -print_format json -show_format -show_streams \"{filePath}\"";
            process.StartInfo.UseShellExecute = false;
            process.StartInfo.RedirectStandardOutput = true;
            process.StartInfo.CreateNoWindow = true;

            process.Start();
            var jsonOutput = await process.StandardOutput.ReadToEndAsync(cancellationToken);
            await process.WaitForExitAsync(cancellationToken);

            if (string.IsNullOrWhiteSpace(jsonOutput)) return result;

            using var doc = JsonDocument.Parse(jsonOutput);
            var root = doc.RootElement;

            // Extrai Duração do Formato
            if (root.TryGetProperty("format", out var formatElement) && formatElement.TryGetProperty("duration", out var durProp))
            {
                if (double.TryParse(durProp.GetString(), System.Globalization.CultureInfo.InvariantCulture, out var dur))
                {
                    result.DurationSeconds = dur;
                }
            }

            // Extrai Streams (Vídeo e Áudio)
            if (root.TryGetProperty("streams", out var streamsProp) && streamsProp.ValueKind == JsonValueKind.Array)
            {
                foreach (var stream in streamsProp.EnumerateArray())
                {
                    var codecType = stream.TryGetProperty("codec_type", out var ct) ? ct.GetString() : null;

                    if (codecType == "video" && result.Width == 0)
                    {
                        if (stream.TryGetProperty("width", out var w)) result.Width = w.GetInt32();
                        if (stream.TryGetProperty("height", out var h)) result.Height = h.GetInt32();

                        if (stream.TryGetProperty("r_frame_rate", out var rfr))
                        {
                            var fpsStr = rfr.GetString();
                            if (!string.IsNullOrEmpty(fpsStr) && fpsStr.Contains('/'))
                            {
                                var parts = fpsStr.Split('/');
                                if (double.TryParse(parts[0], out var num) && double.TryParse(parts[1], out var den) && den > 0)
                                {
                                    result.FrameRate = Math.Round(num / den, 2);
                                }
                            }
                        }

                        // Verifica timecode nas tags de vídeo
                        if (stream.TryGetProperty("tags", out var tags) && tags.TryGetProperty("timecode", out var tcProp) && tcProp.ValueKind == JsonValueKind.String)
                        {
                            result.TimecodeStart = tcProp.GetString() ?? "00:00:00:00";
                        }
                    }
                    else if (codecType == "audio")
                    {
                        if (stream.TryGetProperty("channels", out var ch))
                        {
                            result.AudioChannels = ch.GetInt32();
                        }
                    }
                }
            }

            logger.LogInformation("[FFprobeService] Metadados extraídos para '{FileName}': Duração: {Dur}s, Resolução: {W}x{H}, FPS: {Fps}, Canais: {Ch}",
                Path.GetFileName(filePath), result.DurationSeconds, result.Width, result.Height, result.FrameRate, result.AudioChannels);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[FFprobeService] Falha ao extrair metadados via ffprobe para {FilePath}", filePath);
        }

        return result;
    }
}
