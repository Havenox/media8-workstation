using Media8.Workstation.Api.Attributes;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Api.Controllers;

[ApiController]
[Route("api/v1/internal/jobs")]
[AllowAnonymous]
[InternalWorkerAuth]
public class InternalJobsController(
    WorkstationDbContext dbContext,
    ILogger<InternalJobsController> logger) : ControllerBase
{
    private const string GoogleDriveApiKeySettingKey = "GoogleDrive:ApiKey";

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

    public record NextTranscodeJobResponse(
        Guid JobId,
        Guid ProjectId,
        Guid AssetId,
        string RawFilePath,
        string MimeType
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

    public record CompleteTranscodeRequest(
        Guid AssetId,
        string? ProxyPath,
        string? WaveformJsonPath,
        double DurationSeconds,
        int Width,
        int Height,
        double FrameRate,
        int AudioChannels,
        string TimecodeStart
    );

    public record JobFailureRequest(string ErrorMessage);

    [HttpPost("next-ingest")]
    public async Task<ActionResult<NextIngestJobResponse>> GetNextIngestJob(CancellationToken cancellationToken)
    {
        using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var job = await dbContext.MediaProcessingJobs
                .FromSqlRaw(@"
                    SELECT j.* FROM ""MediaProcessingJobs"" j
                    WHERE j.""JobType"" = 'IngestDownload' AND j.""Status"" = 'Pending'
                    ORDER BY j.""Priority"" ASC, j.""CreatedAt"" ASC
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED")
                .FirstOrDefaultAsync(cancellationToken);

            if (job == null)
            {
                await tx.RollbackAsync(cancellationToken);
                return NoContent();
            }

            job.Status = "InProcessing";
            job.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            // Carrega Chave de API
            var apiKeySetting = await dbContext.SystemSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == GoogleDriveApiKeySettingKey, cancellationToken);
            var apiKey = apiKeySetting?.Value ?? string.Empty;

            // Determina Projeto e Links
            Guid projectId = Guid.Empty;
            List<IngestJobLinkDto> linksToProcess = new();

            if (job.ProjectId.HasValue)
            {
                projectId = job.ProjectId.Value;
                var dbLinks = await dbContext.ProjectLinks
                    .AsNoTracking()
                    .Where(l => l.ProjectId == projectId)
                    .ToListAsync(cancellationToken);

                linksToProcess = dbLinks.Select(l => new IngestJobLinkDto(l.ProjectLinkId, l.ProjectId, l.Url, l.LinkType)).ToList();
            }
            else if (job.AssetId.HasValue)
            {
                var asset = await dbContext.WorkstationAssets
                    .AsNoTracking()
                    .FirstOrDefaultAsync(a => a.AssetId == job.AssetId.Value, cancellationToken);

                if (asset != null)
                {
                    projectId = asset.ProjectId;
                    if (!string.IsNullOrWhiteSpace(asset.ExternalSourceUrl))
                    {
                        linksToProcess.Add(new IngestJobLinkDto(Guid.NewGuid(), asset.ProjectId, asset.ExternalSourceUrl, "GoogleDrive"));
                    }
                }
            }

            // Deduplicação Idempotente
            var existingAssets = await dbContext.WorkstationAssets
                .AsNoTracking()
                .Where(a => a.ProjectId == projectId)
                .ToListAsync(cancellationToken);

            var existingExternalIds = existingAssets
                .Where(a => !string.IsNullOrEmpty(a.ExternalSourceId))
                .Select(a => a.ExternalSourceId!)
                .ToList();

            var existingHashes = existingAssets
                .Where(a => !string.IsNullOrEmpty(a.FileHash))
                .Select(a => a.FileHash!)
                .ToList();

            var targetProject = await dbContext.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.ProjectId == projectId, cancellationToken);

            bool shouldDownloadNow = (targetProject?.AutoIngest == true) || job.AssetId.HasValue;

            return Ok(new NextIngestJobResponse(
                job.JobId,
                projectId,
                job.AssetId,
                apiKey,
                shouldDownloadNow,
                linksToProcess,
                existingExternalIds,
                existingHashes
            ));
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync(cancellationToken);
            logger.LogError(ex, "[InternalJobsController] Erro ao buscar próximo job de ingestão.");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("next-transcode")]
    public async Task<ActionResult<NextTranscodeJobResponse>> GetNextTranscodeJob(CancellationToken cancellationToken)
    {
        using var tx = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        try
        {
            var job = await dbContext.MediaProcessingJobs
                .FromSqlRaw(@"
                    SELECT j.* FROM ""MediaProcessingJobs"" j
                    WHERE j.""JobType"" = 'TranscodeProxy' AND j.""Status"" = 'Pending'
                    ORDER BY j.""Priority"" ASC, j.""CreatedAt"" ASC
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED")
                .FirstOrDefaultAsync(cancellationToken);

            if (job == null || !job.AssetId.HasValue)
            {
                await tx.RollbackAsync(cancellationToken);
                return NoContent();
            }

            var asset = await dbContext.WorkstationAssets
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.AssetId == job.AssetId.Value, cancellationToken);

            if (asset == null || string.IsNullOrEmpty(asset.StoragePathHighFidelity))
            {
                job.Status = "Failed";
                job.ErrorMessage = "Arquivo bruto não encontrado no cadastro do ativo.";
                job.UpdatedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync(cancellationToken);
                await tx.CommitAsync(cancellationToken);
                return NoContent();
            }

            job.Status = "InProcessing";
            job.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
            await tx.CommitAsync(cancellationToken);

            return Ok(new NextTranscodeJobResponse(
                job.JobId,
                asset.ProjectId,
                asset.AssetId,
                asset.StoragePathHighFidelity,
                asset.MimeType
            ));
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync(cancellationToken);
            logger.LogError(ex, "[InternalJobsController] Erro ao buscar próximo job de transcodificação.");
            return StatusCode(500, new { message = ex.Message });
        }
    }

    [HttpPost("{jobId}/register-asset")]
    public async Task<IActionResult> RegisterAsset(Guid jobId, [FromBody] RegisterAssetRequest req, CancellationToken cancellationToken)
    {
        var job = await dbContext.MediaProcessingJobs.FirstOrDefaultAsync(j => j.JobId == jobId, cancellationToken);
        if (job == null) return NotFound(new { message = "Job não encontrado." });

        var targetAssetId = req.AssetId ?? Guid.NewGuid();
        var existingAsset = await dbContext.WorkstationAssets.FirstOrDefaultAsync(a => a.AssetId == targetAssetId, cancellationToken);

        var asset = existingAsset ?? new WorkstationAsset { AssetId = targetAssetId, ProjectId = req.ProjectId };
        asset.ProjectLinkId = req.ProjectLinkId;
        asset.Title = req.Title;
        asset.OriginalFileName = req.OriginalFileName;
        asset.ExternalSourceUrl = req.ExternalSourceUrl;
        asset.ExternalSourceId = req.ExternalSourceId;
        asset.FileHash = req.FileHash;
        asset.FileSizeBytes = req.FileSizeBytes;
        asset.MimeType = string.IsNullOrWhiteSpace(req.MimeType) ? "video/mp4" : req.MimeType;

        if (req.IsDownloaded && !string.IsNullOrEmpty(req.DownloadedFilePath))
        {
            asset.StoragePathHighFidelity = req.DownloadedFilePath;
            asset.Status = "Ingested";

            // Enfileira job de transcodificação de proxy
            var transcodeJob = new MediaProcessingJob
            {
                JobId = Guid.NewGuid(),
                ProjectId = req.ProjectId,
                AssetId = targetAssetId,
                JobType = "TranscodeProxy",
                Status = "Pending",
                Priority = 10,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            dbContext.MediaProcessingJobs.Add(transcodeJob);
        }
        else
        {
            asset.Status = "Discovered";
        }

        if (existingAsset == null)
        {
            dbContext.WorkstationAssets.Add(asset);
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { assetId = targetAssetId, status = asset.Status });
    }

    [HttpPost("{jobId}/complete-transcode")]
    public async Task<IActionResult> CompleteTranscode(Guid jobId, [FromBody] CompleteTranscodeRequest req, CancellationToken cancellationToken)
    {
        var job = await dbContext.MediaProcessingJobs.FirstOrDefaultAsync(j => j.JobId == jobId, cancellationToken);
        if (job == null) return NotFound(new { message = "Job não encontrado." });

        var asset = await dbContext.WorkstationAssets.FirstOrDefaultAsync(a => a.AssetId == req.AssetId, cancellationToken);
        if (asset != null)
        {
            asset.StoragePathProxy = req.ProxyPath;
            asset.WaveformJsonPath = req.WaveformJsonPath;
            asset.DurationSeconds = req.DurationSeconds;
            asset.Width = req.Width;
            asset.Height = req.Height;
            asset.FrameRate = req.FrameRate;
            asset.AudioChannels = req.AudioChannels;
            asset.TimecodeStart = req.TimecodeStart;
            asset.Status = "Ready";
        }

        job.Status = "Completed";
        job.UpdatedAt = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Transcodificação concluída com sucesso." });
    }

    [HttpPost("{jobId}/complete")]
    public async Task<IActionResult> CompleteJob(Guid jobId, CancellationToken cancellationToken)
    {
        var job = await dbContext.MediaProcessingJobs.FirstOrDefaultAsync(j => j.JobId == jobId, cancellationToken);
        if (job == null) return NotFound(new { message = "Job não encontrado." });

        job.Status = "Completed";
        job.UpdatedAt = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Job concluído." });
    }

    [HttpPost("{jobId}/fail")]
    public async Task<IActionResult> FailJob(Guid jobId, [FromBody] JobFailureRequest req, CancellationToken cancellationToken)
    {
        var job = await dbContext.MediaProcessingJobs.FirstOrDefaultAsync(j => j.JobId == jobId, cancellationToken);
        if (job == null) return NotFound(new { message = "Job não encontrado." });

        job.Status = "Failed";
        job.ErrorMessage = req.ErrorMessage;
        job.UpdatedAt = DateTime.UtcNow;

        if (job.AssetId.HasValue)
        {
            var asset = await dbContext.WorkstationAssets.FirstOrDefaultAsync(a => a.AssetId == job.AssetId.Value, cancellationToken);
            if (asset != null)
            {
                asset.Status = "Failed";
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Job marcado como falho." });
    }
}
