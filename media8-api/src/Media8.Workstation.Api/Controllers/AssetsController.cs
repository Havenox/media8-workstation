using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Api.Controllers;

/// <summary>
/// Modelo de requisição para ingestão de mídia remota.
/// </summary>
public class IngestMediaRequest
{
    public Guid OrderId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string ExternalSourceUrl { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
}

/// <summary>
/// Controlador responsável pelo gerenciamento de Assets e enfileiramento de Ingestão.
/// </summary>
[Authorize]
public class AssetsController(WorkstationDbContext context) : WorkstationBaseController
{
    private readonly WorkstationDbContext _context = context;

    /// <summary>
    /// Retorna todas as mídias de uma Order específica.
    /// </summary>
    [HttpGet("Order/{orderId:guid}")]
    public async Task<ActionResult<IEnumerable<WorkstationAsset>>> GetAssetsByOrder(Guid orderId)
    {
        var assets = await _context.WorkstationAssets
            .Include(a => a.Markers)
            .Where(a => a.OrderId == orderId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

        return Ok(assets);
    }

    /// <summary>
    /// Retorna uma mídia por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WorkstationAsset>> GetAssetById(Guid id)
    {
        var asset = await _context.WorkstationAssets
            .Include(a => a.Markers)
            .FirstOrDefaultAsync(a => a.AssetId == id);

        if (asset == null) return NotFound();

        return Ok(asset);
    }

    /// <summary>
    /// Registra um novo pedido de ingestão de mídia via link externo.
    /// </summary>
    [HttpPost("Ingest")]
    public async Task<ActionResult<WorkstationAsset>> IngestMedia([FromBody] IngestMediaRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.ExternalSourceUrl) || string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { Message = "URL do link e Título são obrigatórios." });
        }

        var asset = new WorkstationAsset
        {
            OrderId = request.OrderId,
            Title = request.Title,
            ExternalSourceUrl = request.ExternalSourceUrl,
            OriginalFileName = request.OriginalFileName,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.WorkstationAssets.Add(asset);
        await _context.SaveChangesAsync();

        var job = new MediaProcessingJob
        {
            AssetId = asset.AssetId,
            JobType = "IngestDownload",
            Status = "Pending",
            Priority = 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MediaProcessingJobs.Add(job);
        await _context.SaveChangesAsync();

        return AcceptedAtAction(nameof(GetAssetById), new { id = asset.AssetId }, asset);
    }
}
