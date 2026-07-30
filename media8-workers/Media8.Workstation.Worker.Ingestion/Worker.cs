using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Media8.Workstation.Worker.Ingestion.Providers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Media8.Workstation.Worker.Ingestion;

public class Worker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEnumerable<IIngestionProvider> _providers;
    private readonly IConfiguration _configuration;
    private readonly ILogger<Worker> _logger;

    private const string GoogleDriveApiKeySettingKey = "GoogleDrive:ApiKey";

    public Worker(
        IServiceScopeFactory scopeFactory,
        IEnumerable<IIngestionProvider> providers,
        IConfiguration configuration,
        ILogger<Worker> logger)
    {
        _scopeFactory = scopeFactory;
        _providers = providers;
        _configuration = configuration;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("[Worker.Ingestion] Serviço de Ingestão de Mídias iniciado.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var dbContext = scope.ServiceProvider.GetRequiredService<WorkstationDbContext>();

                var job = await dbContext.MediaProcessingJobs
                    .Where(j => j.JobType == "IngestDownload" && j.Status == "Pending")
                    .OrderBy(j => j.Priority)
                    .ThenBy(j => j.CreatedAt)
                    .FirstOrDefaultAsync(stoppingToken);

                if (job != null)
                {
                    _logger.LogInformation("[Worker.Ingestion] Processando Job {JobId}...", job.JobId);
                    job.Status = "Processing";
                    job.UpdatedAt = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync(stoppingToken);

                    // Carrega a Chave de API do Google Drive do banco de dados
                    var apiKeySetting = await dbContext.SystemSettings
                        .AsNoTracking()
                        .FirstOrDefaultAsync(s => s.Key == GoogleDriveApiKeySettingKey, stoppingToken);

                    var apiKey = apiKeySetting?.Value ?? string.Empty;

                    // Identifica se o job está atrelado a um Project ou a um Asset
                    Guid projectId = Guid.Empty;
                    List<ProjectLink> linksToProcess = new();

                    if (job.ProjectId.HasValue)
                    {
                        projectId = job.ProjectId.Value;
                        linksToProcess = await dbContext.ProjectLinks
                            .Where(l => l.ProjectId == projectId)
                            .ToListAsync(stoppingToken);
                    }
                    else if (job.AssetId.HasValue)
                    {
                        var asset = await dbContext.WorkstationAssets
                            .AsNoTracking()
                            .FirstOrDefaultAsync(a => a.AssetId == job.AssetId.Value, stoppingToken);

                        if (asset != null)
                        {
                            projectId = asset.ProjectId;
                            if (!string.IsNullOrWhiteSpace(asset.ExternalSourceUrl))
                            {
                                linksToProcess.Add(new ProjectLink
                                {
                                    ProjectLinkId = Guid.NewGuid(),
                                    ProjectId = asset.ProjectId,
                                    Url = asset.ExternalSourceUrl,
                                    LinkType = "GoogleDrive"
                                });
                            }
                        }
                    }

                    var storageBasePath = _configuration["STORAGE_PATH"];
                    if (string.IsNullOrWhiteSpace(storageBasePath))
                    {
                        storageBasePath = Directory.Exists("/storage")
                            ? "/storage"
                            : Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "media8-storage"));
                    }

                    var rawTargetDir = Path.Combine(storageBasePath, "raw", projectId.ToString());

                    // Carrega os ativos já catalogados no projeto para deduplicação idempotente
                    var existingAssets = await dbContext.WorkstationAssets
                        .AsNoTracking()
                        .Where(a => a.ProjectId == projectId)
                        .ToListAsync(stoppingToken);

                    var existingExternalIds = new HashSet<string>(
                        existingAssets.Where(a => !string.IsNullOrEmpty(a.ExternalSourceId)).Select(a => a.ExternalSourceId!),
                        StringComparer.OrdinalIgnoreCase
                    );

                    var existingHashes = new HashSet<string>(
                        existingAssets.Where(a => !string.IsNullOrEmpty(a.FileHash)).Select(a => a.FileHash!),
                        StringComparer.OrdinalIgnoreCase
                    );

                    bool IsAlreadyIngested(DiscoveredMediaFile file)
                    {
                        if (!string.IsNullOrEmpty(file.ExternalId) && existingExternalIds.Contains(file.ExternalId))
                        {
                            _logger.LogInformation("[Worker.Ingestion] ⏭️ Mídia '{FileName}' (ID: {ExternalId}) já catalogada. Download ignorado para evitar duplicidade.", file.FileName, file.ExternalId);
                            return true;
                        }
                        if (!string.IsNullOrEmpty(file.FileHash) && existingHashes.Contains(file.FileHash))
                        {
                            _logger.LogInformation("[Worker.Ingestion] ⏭️ Mídia '{FileName}' (Hash MD5: {Hash}) já catalogada. Download ignorado para evitar duplicidade.", file.FileName, file.FileHash);
                            return true;
                        }
                        return false;
                    }

                    int totalIngestedFiles = 0;

                    foreach (var link in linksToProcess)
                    {
                        var provider = _providers.FirstOrDefault(p => p.CanHandle(link.Url, link.LinkType));

                        if (provider == null)
                        {
                            _logger.LogWarning("[Worker.Ingestion] Nenhum provedor configurado para o link '{Url}' (Tipo: {LinkType}). Ignorando com segurança.", link.Url, link.LinkType);
                            continue;
                        }

                        _logger.LogInformation("[Worker.Ingestion] Executando varredura via {ProviderName} para URL: {Url}", provider.GetType().Name, link.Url);

                        var result = await provider.DiscoverAndDownloadFilesAsync(
                            link,
                            apiKey,
                            rawTargetDir,
                            IsAlreadyIngested,
                            async (discoveredFile, downloadedFilePath) =>
                            {
                                // Inserção atômica de cada mídia física descoberta no banco
                                var newAssetId = Guid.NewGuid();
                                var newAsset = new WorkstationAsset
                                {
                                    AssetId = newAssetId,
                                    ProjectId = projectId,
                                    Title = discoveredFile.FileName,
                                    OriginalFileName = discoveredFile.FileName,
                                    ExternalSourceUrl = link.Url,
                                    ExternalSourceId = discoveredFile.ExternalId,
                                    FileHash = discoveredFile.FileHash,
                                    StoragePathHighFidelity = downloadedFilePath,
                                    FileSizeBytes = discoveredFile.FileSizeBytes,
                                    MimeType = string.IsNullOrWhiteSpace(discoveredFile.MimeType) ? "video/mp4" : discoveredFile.MimeType,
                                    Status = "Ingested",
                                    CreatedAt = DateTime.UtcNow
                                };

                                dbContext.WorkstationAssets.Add(newAsset);

                                if (!string.IsNullOrEmpty(discoveredFile.ExternalId)) existingExternalIds.Add(discoveredFile.ExternalId);
                                if (!string.IsNullOrEmpty(discoveredFile.FileHash)) existingHashes.Add(discoveredFile.FileHash);

                                // Enfileira job de transcodificação de proxy para o Worker.Transcoder
                                var transcodeJob = new MediaProcessingJob
                                {
                                    JobId = Guid.NewGuid(),
                                    AssetId = newAssetId,
                                    JobType = "TranscodeProxy",
                                    Status = "Pending",
                                    Priority = 10,
                                    CreatedAt = DateTime.UtcNow,
                                    UpdatedAt = DateTime.UtcNow
                                };

                                dbContext.MediaProcessingJobs.Add(transcodeJob);
                                await dbContext.SaveChangesAsync(stoppingToken);

                                totalIngestedFiles++;
                                _logger.LogInformation("[Worker.Ingestion] ✓ Mídia '{FileName}' catalogada com sucesso (AssetId: {AssetId}). Job TranscodeProxy enfileirado.", discoveredFile.FileName, newAssetId);
                            },
                            stoppingToken);

                        if (!result.Success)
                        {
                            _logger.LogError("[Worker.Ingestion] ❌ Falha durante ingestão do link {Url}: {Error}", link.Url, result.ErrorMessage);
                        }
                    }

                    job.Status = "Completed";
                    job.UpdatedAt = DateTime.UtcNow;
                    await dbContext.SaveChangesAsync(stoppingToken);

                    _logger.LogInformation("[Worker.Ingestion] Job {JobId} concluído com sucesso. Total de mídias físicas ingeridas: {TotalCount}.", job.JobId, totalIngestedFiles);
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
