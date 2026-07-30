using Media8.Workstation.Worker.Ingestion.Providers;
using Media8.Workstation.Worker.Ingestion.Services;

namespace Media8.Workstation.Worker.Ingestion;

public class Worker : BackgroundService
{
    private readonly InternalApiClient _apiClient;
    private readonly IEnumerable<IIngestionProvider> _providers;
    private readonly IConfiguration _configuration;
    private readonly ILogger<Worker> _logger;

    public Worker(
        InternalApiClient apiClient,
        IEnumerable<IIngestionProvider> providers,
        IConfiguration configuration,
        ILogger<Worker> logger)
    {
        _apiClient = apiClient;
        _providers = providers;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[Worker.Ingestion] Serviço de Ingestão de Mídias iniciado (Comunicação 100% REST API).");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var job = await _apiClient.GetNextIngestJobAsync(stoppingToken);

                if (job != null)
                {
                    _logger.LogInformation("[Worker.Ingestion] Processando Job {JobId} para Projeto {ProjectId}...", job.JobId, job.ProjectId);

                    var storageBasePath = _configuration["STORAGE_PATH"];
                    if (string.IsNullOrWhiteSpace(storageBasePath))
                    {
                        storageBasePath = Directory.Exists("/storage")
                            ? "/storage"
                            : Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "media8-storage"));
                    }

                    var rawTargetDir = Path.Combine(storageBasePath, "raw", job.ProjectId.ToString());

                    var existingExternalIds = new HashSet<string>(job.ExistingExternalIds, StringComparer.OrdinalIgnoreCase);
                    var existingHashes = new HashSet<string>(job.ExistingHashes, StringComparer.OrdinalIgnoreCase);

                    bool IsAlreadyIngested(DiscoveredMediaFile file)
                    {
                        if (!string.IsNullOrEmpty(file.ExternalId) && existingExternalIds.Contains(file.ExternalId))
                        {
                            _logger.LogInformation("[Worker.Ingestion] ⏭️ Mídia '{FileName}' (ID: {ExternalId}) já catalogada. Download ignorado.", file.FileName, file.ExternalId);
                            return true;
                        }
                        if (!string.IsNullOrEmpty(file.FileHash) && existingHashes.Contains(file.FileHash))
                        {
                            _logger.LogInformation("[Worker.Ingestion] ⏭️ Mídia '{FileName}' (Hash MD5: {Hash}) já catalogada. Download ignorado.", file.FileName, file.FileHash);
                            return true;
                        }
                        return false;
                    }

                    int totalIngestedFiles = 0;

                    foreach (var linkDto in job.Links)
                    {
                        var linkEntity = new Domain.Entities.ProjectLink
                        {
                            ProjectLinkId = linkDto.ProjectLinkId,
                            ProjectId = linkDto.ProjectId,
                            Url = linkDto.Url,
                            LinkType = linkDto.LinkType
                        };

                        var provider = _providers.FirstOrDefault(p => p.CanHandle(linkEntity.Url, linkEntity.LinkType));

                        if (provider == null)
                        {
                            _logger.LogWarning("[Worker.Ingestion] Nenhum provedor configurado para o link '{Url}'. Ignorando com segurança.", linkEntity.Url);
                            continue;
                        }

                        _logger.LogInformation("[Worker.Ingestion] Executando varredura via {ProviderName} para URL: {Url} (AutoIngest: {AutoIngest})",
                            provider.GetType().Name, linkEntity.Url, job.ShouldDownloadNow);

                        var result = await provider.DiscoverAndDownloadFilesAsync(
                            linkEntity,
                            job.GoogleDriveApiKey,
                            rawTargetDir,
                            IsAlreadyIngested,
                            async (discoveredFile, downloadedFilePath) =>
                            {
                                var req = new RegisterAssetRequest(
                                    job.AssetId,
                                    job.ProjectId,
                                    linkDto.ProjectLinkId,
                                    discoveredFile.FileName,
                                    discoveredFile.FileName,
                                    linkDto.Url,
                                    discoveredFile.ExternalId,
                                    discoveredFile.FileHash,
                                    discoveredFile.FileSizeBytes,
                                    string.IsNullOrWhiteSpace(discoveredFile.MimeType) ? "video/mp4" : discoveredFile.MimeType,
                                    downloadedFilePath,
                                    job.ShouldDownloadNow
                                );

                                bool registered = await _apiClient.RegisterAssetAsync(job.JobId, req, stoppingToken);
                                if (registered)
                                {
                                    if (!string.IsNullOrEmpty(discoveredFile.ExternalId)) existingExternalIds.Add(discoveredFile.ExternalId);
                                    if (!string.IsNullOrEmpty(discoveredFile.FileHash)) existingHashes.Add(discoveredFile.FileHash);
                                    totalIngestedFiles++;

                                    if (job.ShouldDownloadNow)
                                    {
                                        _logger.LogInformation("[Worker.Ingestion] ✓ Mídia '{FileName}' baixada e catalogada via API. TranscodeProxy enfileirado.", discoveredFile.FileName);
                                    }
                                    else
                                    {
                                        _logger.LogInformation("[Worker.Ingestion] 🔍 Mídia '{FileName}' descoberta e catalogada via API (Status: Discovered).", discoveredFile.FileName);
                                    }
                                }
                            },
                            stoppingToken);

                        if (!result.Success)
                        {
                            _logger.LogError("[Worker.Ingestion] ❌ Falha durante ingestão do link {Url}: {Error}", linkDto.Url, result.ErrorMessage);
                        }
                    }

                    await _apiClient.CompleteJobAsync(job.JobId, stoppingToken);
                    _logger.LogInformation("[Worker.Ingestion] Job {JobId} concluído via API. Total de mídias físicas ingeridas: {TotalCount}.", job.JobId, totalIngestedFiles);
                }
                else
                {
                    await Task.Delay(2000, stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "[Worker.Ingestion] Erro não tratado durante o ciclo do Worker. Tentando novamente em 5 segundos...");
                await Task.Delay(5000, stoppingToken);
            }
        }
    }
}
