using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Worker.Transcoder.Services;

namespace Media8.Workstation.Worker.Transcoder;

public class Worker(
    ILogger<Worker> logger,
    InternalApiClient apiClient,
    TranscoderPipelineService pipelineService) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("[Worker.Transcoder] Iniciado com sucesso. Escutando fila de transcodificação (100% REST API)...");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                bool processed = await ProcessNextTranscodeJobAsync(stoppingToken);
                if (processed)
                {
                    continue;
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "[Worker.Transcoder] Erro inesperado no loop principal do Transcoder.");
            }

            await Task.Delay(3000, stoppingToken);
        }
    }

    private async Task<bool> ProcessNextTranscodeJobAsync(CancellationToken stoppingToken)
    {
        var job = await apiClient.GetNextTranscodeJobAsync(stoppingToken);
        if (job == null) return false;

        logger.LogInformation("[Worker.Transcoder] Executando transcodificação do Job {JobId} para Asset {AssetId}...", job.JobId, job.AssetId);

        if (!File.Exists(job.RawFilePath))
        {
            logger.LogWarning("[Worker.Transcoder] Arquivo bruto {RawPath} não encontrado. Notificando falha via API.", job.RawFilePath);
            await apiClient.FailJobAsync(job.JobId, $"Arquivo bruto {job.RawFilePath} não encontrado.", stoppingToken);
            return true;
        }

        var assetEntity = new WorkstationAsset
        {
            AssetId = job.AssetId,
            ProjectId = job.ProjectId,
            MimeType = job.MimeType,
            StoragePathHighFidelity = job.RawFilePath
        };

        var pipelineResult = await pipelineService.ProcessAssetAsync(assetEntity, job.RawFilePath, stoppingToken);

        if (pipelineResult.Success)
        {
            var req = new CompleteTranscodeRequest(
                job.AssetId,
                pipelineResult.HighFidelityPath,
                pipelineResult.ProxyPath,
                pipelineResult.WaveformJsonPath,
                pipelineResult.Metadata.DurationSeconds,
                pipelineResult.Metadata.Width,
                pipelineResult.Metadata.Height,
                pipelineResult.Metadata.FrameRate,
                pipelineResult.Metadata.AudioChannels,
                pipelineResult.Metadata.TimecodeStart
            );

            await apiClient.CompleteTranscodeAsync(job.JobId, req, stoppingToken);
            logger.LogInformation("[Worker.Transcoder] ✓ Transcodificação concluída com sucesso via API para Asset {AssetId}.", job.AssetId);
        }
        else
        {
            await apiClient.FailJobAsync(job.JobId, pipelineResult.ErrorMessage ?? "Falha desconhecida na transcodificação.", stoppingToken);
            logger.LogError("[Worker.Transcoder] ❌ Falha na transcodificação para Asset {AssetId}: {Error}", job.AssetId, pipelineResult.ErrorMessage);
        }

        return true;
    }
}
