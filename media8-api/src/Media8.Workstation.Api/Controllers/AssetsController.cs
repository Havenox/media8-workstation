using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Media8.Workstation.Api.Controllers;

[ApiController]
[Route("api/v1/Projects/{projectId:guid}/[controller]")]
[Authorize]
public class AssetsController : ControllerBase
{
    private readonly WorkstationDbContext _context;
    private readonly IConfiguration _configuration;

    public AssetsController(WorkstationDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    /// <summary>
    /// Lista todas as mídias salvas ou descobertas de um projeto específico.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetProjectAssets(Guid projectId)
    {
        var projectExists = await _context.Projects.AnyAsync(p => p.ProjectId == projectId && !p.IsDeleted);
        if (!projectExists) return NotFound("Projeto não encontrado.");

        var assets = await _context.WorkstationAssets
            .AsNoTracking()
            .Where(a => a.ProjectId == projectId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(assets);
    }

    /// <summary>
    /// Remove uma mídia individualmente, limpando os arquivos físicos do disco e o registro no banco.
    /// </summary>
    [HttpDelete("{assetId:guid}")]
    public async Task<IActionResult> DeleteAsset(Guid projectId, Guid assetId)
    {
        var asset = await _context.WorkstationAssets
            .FirstOrDefaultAsync(a => a.AssetId == assetId && a.ProjectId == projectId);

        if (asset == null) return NotFound();

        // 1. Purga arquivos físicos do disco
        PurgeAssetDiskFiles(asset);

        // 2. Remove jobs pendentes ou processados associados a este ativo
        var jobs = await _context.MediaProcessingJobs.Where(j => j.AssetId == assetId).ToListAsync();
        _context.MediaProcessingJobs.RemoveRange(jobs);

        // 3. Remove registro da tabela WorkstationAssets
        _context.WorkstationAssets.Remove(asset);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Dispara a ingestão/download de um ativo que foi apenas descoberto (Status = Discovered).
    /// </summary>
    [HttpPost("{assetId:guid}/download")]
    public async Task<IActionResult> TriggerAssetDownload(Guid projectId, Guid assetId)
    {
        var asset = await _context.WorkstationAssets
            .FirstOrDefaultAsync(a => a.AssetId == assetId && a.ProjectId == projectId);

        if (asset == null) return NotFound();

        asset.Status = "Downloading";

        var job = new MediaProcessingJob
        {
            JobId = Guid.NewGuid(),
            ProjectId = projectId,
            AssetId = assetId,
            JobType = "IngestDownload",
            Status = "Pending",
            Priority = 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MediaProcessingJobs.Add(job);
        await _context.SaveChangesAsync();

        return Ok(new { Message = $"Download enfileirado para o ativo '{asset.Title}'.", AssetId = assetId });
    }

    private void PurgeAssetDiskFiles(WorkstationAsset asset)
    {
        if (!string.IsNullOrEmpty(asset.StoragePathHighFidelity) && System.IO.File.Exists(asset.StoragePathHighFidelity))
        {
            try { System.IO.File.Delete(asset.StoragePathHighFidelity); } catch { }
        }
        if (!string.IsNullOrEmpty(asset.StoragePathProxy) && System.IO.File.Exists(asset.StoragePathProxy))
        {
            try { System.IO.File.Delete(asset.StoragePathProxy); } catch { }
        }
        if (!string.IsNullOrEmpty(asset.WaveformJsonPath) && System.IO.File.Exists(asset.WaveformJsonPath))
        {
            try { System.IO.File.Delete(asset.WaveformJsonPath); } catch { }
        }
    }
}
