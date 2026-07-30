using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Media8.Workstation.Worker.Transcoder.Services;

public record NextTranscodeJobResponse(
    Guid JobId,
    Guid ProjectId,
    Guid AssetId,
    string RawFilePath,
    string MimeType
);

public record CompleteTranscodeRequest(
    Guid AssetId,
    string? HighFidelityPath,
    string? ProxyPath,
    string? WaveformJsonPath,
    long FileSizeBytesHighFidelity,
    long FileSizeBytesProxy,
    double DurationSeconds,
    int Width,
    int Height,
    double FrameRate,
    int AudioChannels,
    string TimecodeStart
);

public class InternalApiClient(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<InternalApiClient> logger)
{
    private const string SecretHeaderName = "X-Internal-Secret";

    private void EnsureSecretHeader()
    {
        var secret = configuration["INTERNAL_WORKER_SECRET"] ?? "W0rk3rS3cr3tKeyM3dia8PAM2026!";
        if (!httpClient.DefaultRequestHeaders.Contains(SecretHeaderName))
        {
            httpClient.DefaultRequestHeaders.Add(SecretHeaderName, secret);
        }
    }

    public async Task<NextTranscodeJobResponse?> GetNextTranscodeJobAsync(CancellationToken cancellationToken = default)
    {
        EnsureSecretHeader();
        var baseUrl = (configuration["API_URL"] ?? "http://localhost:5000").TrimEnd('/');
        var url = $"{baseUrl}/api/v1/internal/jobs/next-transcode";

        try
        {
            var response = await httpClient.PostAsync(url, null, cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NoContent) return null;

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<NextTranscodeJobResponse>(cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[InternalApiClient] Falha ao consultar próximo job de transcodificação na API.");
            return null;
        }
    }

    public async Task<bool> CompleteTranscodeAsync(Guid jobId, CompleteTranscodeRequest request, CancellationToken cancellationToken = default)
    {
        EnsureSecretHeader();
        var baseUrl = (configuration["API_URL"] ?? "http://localhost:5000").TrimEnd('/');
        var url = $"{baseUrl}/api/v1/internal/jobs/{jobId}/complete-transcode";

        try
        {
            var response = await httpClient.PostAsJsonAsync(url, request, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[InternalApiClient] Falha ao sinalizar conclusão de transcodificação para Job {JobId}", jobId);
            return false;
        }
    }

    public async Task FailJobAsync(Guid jobId, string errorMessage, CancellationToken cancellationToken = default)
    {
        EnsureSecretHeader();
        var baseUrl = (configuration["API_URL"] ?? "http://localhost:5000").TrimEnd('/');
        var url = $"{baseUrl}/api/v1/internal/jobs/{jobId}/fail";

        try
        {
            await httpClient.PostAsJsonAsync(url, new { errorMessage }, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[InternalApiClient] Falha ao registrar erro para Job {JobId}", jobId);
        }
    }
}
