using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Media8.Workstation.Worker.Transcoder.Services;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Worker.Transcoder;

public class Worker(
    ILogger<Worker> logger,
    IServiceProvider serviceProvider,
    IConfiguration configuration) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("[Worker.Transcoder] Iniciado com sucesso. Escutando fila de transcodificação (JobType: TranscodeProxy)...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                bool processed = await ProcessNextTranscodeJobAsync(stoppingToken);
                if (processed)
                {
                    // Se processou um item com sucesso, continua imediatamente sem delay
                    continue;
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[Worker.Transcoder] Erro inesperado no loop principal do Transcoder.");
            }

            // Aguarda 3 segundos antes da próxima verificação se a fila estiver vazia
            await Task.Delay(3000, stoppingToken);
        }
    }

    private async Task<bool> ProcessNextTranscodeJobAsync(CancellationToken stoppingToken)
    {
        using var scope = serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<WorkstationDbContext>();
        var pipelineService = scope.ServiceProvider.GetRequiredService<TranscoderPipelineService>();

        MediaProcessingJob? job = null;

        using var tx = await dbContext.Database.BeginTransactionAsync(stoppingToken);
        try
        {
            // Busca o próximo job pendente da fila de transcodificação com skip locked
            job = await dbContext.MediaProcessingJobs
                .FromSqlRaw(@"
                    SELECT j.* FROM ""MediaProcessingJobs"" j
                    WHERE j.""JobType"" = 'TranscodeProxy'
                      AND j.""Status"" = 'Pending'
                    ORDER BY j.""Priority"" ASC, j.""CreatedAt"" ASC
                    LIMIT 1
                    FOR UPDATE SKIP LOCKED")
                .FirstOrDefaultAsync(stoppingToken);

            if (job == null || !job.AssetId.HasValue)
            {
                await tx.RollbackAsync(stoppingToken);
                return false;
            }

            job.Status = "InProcessing";
            job.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync(stoppingToken);
            await tx.CommitAsync(stoppingToken);
        }
        catch (Exception ex)
        {
            await tx.RollbackAsync(stoppingToken);
            logger.LogError(ex, "[Worker.Transcoder] Falha ao capturar o próximo job de transcodificação.");
            return false;
        }

        logger.LogInformation("[Worker.Transcoder] Executando transcodificação do Job {JobId} para Asset {AssetId}...", job.JobId, job.AssetId);

        var asset = await dbContext.WorkstationAssets.FirstOrDefaultAsync(a => a.AssetId == job.AssetId.Value, stoppingToken);
        if (asset == null || string.IsNullOrEmpty(asset.StoragePathHighFidelity) || !File.Exists(asset.StoragePathHighFidelity))
        {
            logger.LogWarning("[Worker.Transcoder] Asset {AssetId} não possui arquivo bruto local. Marcando job como Failed.", job.AssetId);
            job.Status = "Failed";
            job.ErrorMessage = "Arquivo bruto local de alta fidelidade não encontrado.";
            job.UpdatedAt = DateTime.UtcNow;

            if (asset != null) asset.Status = "Failed";
            await dbContext.SaveChangesAsync(stoppingToken);
            return true;
        }

        // Transcodifica a mídia via PipelineService
        var pipelineResult = await pipelineService.ProcessAssetAsync(asset, asset.StoragePathHighFidelity, stoppingToken);

        if (pipelineResult.Success)
        {
            asset.StoragePathProxy = pipelineResult.ProxyPath;
            asset.WaveformJsonPath = pipelineResult.WaveformJsonPath;
            asset.DurationSeconds = pipelineResult.Metadata.DurationSeconds;
            asset.Width = pipelineResult.Metadata.Width;
            asset.Height = pipelineResult.Metadata.Height;
            asset.FrameRate = pipelineResult.Metadata.FrameRate;
            asset.AudioChannels = pipelineResult.Metadata.AudioChannels;
            asset.TimecodeStart = pipelineResult.Metadata.TimecodeStart;
            asset.Status = "Ready";

            job.Status = "Completed";
            job.UpdatedAt = DateTime.UtcNow;

            logger.LogInformation("[Worker.Transcoder] ✓ Transcodificação concluída com sucesso para Asset {AssetId} (Status: Ready).", asset.AssetId);
        }
        else
        {
            asset.Status = "Failed";
            job.Status = "Failed";
            job.ErrorMessage = pipelineResult.ErrorMessage ?? "Falha desconhecida na transcodificação.";
            job.UpdatedAt = DateTime.UtcNow;

            logger.LogError("[Worker.Transcoder] ❌ Falha na transcodificação para Asset {AssetId}: {Error}", asset.AssetId, pipelineResult.ErrorMessage);
        }

        await dbContext.SaveChangesAsync(stoppingToken);
        return true;
    }
}
