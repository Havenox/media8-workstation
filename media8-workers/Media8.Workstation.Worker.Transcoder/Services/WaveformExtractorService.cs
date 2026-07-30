using System.Diagnostics;
using System.Text.Json;
using Microsoft.Extensions.Logging;

namespace Media8.Workstation.Worker.Transcoder.Services;

public class WaveformJsonDto
{
    public Guid AssetId { get; set; }
    public int SampleRateHz { get; set; } = 8000;
    public int Pps { get; set; } = 20; // 20 pontos por segundo (50ms por ponto)
    public int TotalPoints { get; set; }
    public double DurationSeconds { get; set; }
    public int MaxPeak { get; set; }
    public List<int> Peaks { get; set; } = new();
}

public class WaveformExtractorService(ILogger<WaveformExtractorService> logger)
{
    public async Task<string?> ExtractWaveformAsync(
        Guid assetId,
        string rawFilePath,
        string targetJsonPath,
        double durationSeconds,
        CancellationToken cancellationToken = default)
    {
        if (!File.Exists(rawFilePath))
        {
            logger.LogWarning("[WaveformExtractorService] Arquivo bruto não encontrado: {RawFilePath}", rawFilePath);
            return null;
        }

        var targetDir = Path.GetDirectoryName(targetJsonPath);
        if (!string.IsNullOrEmpty(targetDir) && !Directory.Exists(targetDir))
        {
            Directory.CreateDirectory(targetDir);
        }

        try
        {
            logger.LogInformation("[WaveformExtractorService] Extraindo waveform (20 pps, escala 0..100) para Asset {AssetId}...", assetId);

            using var process = new Process();
            process.StartInfo.FileName = "ffmpeg";
            process.StartInfo.Arguments = $"-y -i \"{rawFilePath}\" -f s16le -ac 1 -ar 8000 -";
            process.StartInfo.UseShellExecute = false;
            process.StartInfo.RedirectStandardOutput = true;
            process.StartInfo.CreateNoWindow = true;

            process.Start();

            var stdoutStream = process.StandardOutput.BaseStream;
            var points = new List<int>();

            // Taxa de amostragem: 8000Hz PCM 16-bit (2 bytes por amostra).
            // 800 bytes = 400 amostras. A 8000 amostras/segundo, 400 amostras duram exatamente 0.05s (50ms).
            // Isto produz exatamente 20 pontos por segundo (20 pps).
            var buffer = new byte[800];
            int bytesRead;

            while ((bytesRead = await stdoutStream.ReadAsync(buffer, 0, buffer.Length, cancellationToken)) > 0)
            {
                int samples = bytesRead / 2;
                if (samples == 0) continue;

                int maxVal = 0;
                for (int i = 0; i < samples; i++)
                {
                    short sample = BitConverter.ToInt16(buffer, i * 2);
                    int val = Math.Abs((int)sample);
                    if (val > maxVal)
                    {
                        maxVal = val;
                    }
                }

                // Normaliza o pico em relação ao limite de 16-bit (32768) na escala de 0 a 100
                int normalized = (int)Math.Round((maxVal / 32768.0) * 100.0);
                points.Add(normalized);
            }

            await process.WaitForExitAsync(cancellationToken);

            int maxPeak = 0;
            if (points.Count > 0)
            {
                maxPeak = points.Max();

                // Ganho dinâmico: se o áudio não for silencioso e o pico máximo for menor que 100%, escala proporcionalmente
                if (maxPeak > 0 && maxPeak < 100)
                {
                    double scale = 100.0 / maxPeak;
                    for (int i = 0; i < points.Count; i++)
                    {
                        points[i] = (int)Math.Round(points[i] * scale);
                    }
                }
            }

            var waveformDto = new WaveformJsonDto
            {
                AssetId = assetId,
                SampleRateHz = 8000,
                Pps = 20,
                TotalPoints = points.Count,
                DurationSeconds = durationSeconds,
                MaxPeak = maxPeak,
                Peaks = points
            };

            var jsonOptions = new JsonSerializerOptions { WriteIndented = false };
            var jsonContent = JsonSerializer.Serialize(waveformDto, jsonOptions);

            await File.WriteAllTextAsync(targetJsonPath, jsonContent, cancellationToken);

            logger.LogInformation("[WaveformExtractorService] ✓ Waveform gerada com sucesso para Asset {AssetId} ({TotalPoints} pontos a 20 pps) -> {Path}",
                assetId, points.Count, targetJsonPath);

            return targetJsonPath;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[WaveformExtractorService] Falha ao extrair waveform para Asset {AssetId}", assetId);
            return null;
        }
    }
}
