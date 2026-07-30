using System.Net.Http.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Media8.Workstation.Worker.Ingestion.Services;

public record IngestJobLinkDto(Guid ProjectLinkId, Guid ProjectId, string Url, string LinkType);

public record NextIngestJobResponse(
    Guid JobId,
    Guid ProjectId,
    Guid? AssetId,
    string GoogleDriveApiKey,
    bool ShouldDownloadNow,
    List<IngestJobLinkDto> Links,
    List<string> ExistingExternalIds,
    List<string> ExistingHashes
);

public record RegisterAssetRequest(
    Guid? AssetId,
    Guid ProjectId,
    Guid? ProjectLinkId,
    string Title,
    string OriginalFileName,
    string ExternalSourceUrl,
    string? ExternalSourceId,
    string? FileHash,
    long FileSizeBytes,
    string MimeType,
    string? DownloadedFilePath,
    bool IsDownloaded
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

    public async Task<NextIngestJobResponse?> GetNextIngestJobAsync(CancellationToken cancellationToken = default)
    {
        EnsureSecretHeader();
        var baseUrl = (configuration["API_URL"] ?? "http://localhost:5000").TrimEnd('/');
        var url = $"{baseUrl}/api/v1/internal/jobs/next-ingest";

        try
        {
            var response = await httpClient.PostAsync(url, null, cancellationToken);
            if (response.StatusCode == System.Net.HttpStatusCode.NoContent) return null;

            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<NextIngestJobResponse>(cancellationToken: cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[InternalApiClient] Falha ao consultar próximo job de ingestão na API.");
            return null;
        }
    }

    public async Task<bool> RegisterAssetAsync(Guid jobId, RegisterAssetRequest request, CancellationToken cancellationToken = default)
    {
        EnsureSecretHeader();
        var baseUrl = (configuration["API_URL"] ?? "http://localhost:5000").TrimEnd('/');
        var url = $"{baseUrl}/api/v1/internal/jobs/{jobId}/register-asset";

        try
        {
            var response = await httpClient.PostAsJsonAsync(url, request, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[InternalApiClient] Falha ao registrar ativo para Job {JobId}", jobId);
            return false;
        }
    }

    public async Task CompleteJobAsync(Guid jobId, CancellationToken cancellationToken = default)
    {
        EnsureSecretHeader();
        var baseUrl = (configuration["API_URL"] ?? "http://localhost:5000").TrimEnd('/');
        var url = $"{baseUrl}/api/v1/internal/jobs/{jobId}/complete";

        try
        {
            await httpClient.PostAsync(url, null, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[InternalApiClient] Falha ao concluir Job {JobId}", jobId);
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
