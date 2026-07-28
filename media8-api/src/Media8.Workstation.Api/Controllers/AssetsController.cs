using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
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
[ApiController]
[Route("api/[controller]")]
public class AssetsController(WorkstationDbContext context) : ControllerBase
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
    /// Retorna os detalhes de um Asset pelo seu ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<WorkstationAsset>> GetAssetById(Guid id)
    {
        var asset = await _context.WorkstationAssets
            .Include(a => a.Markers)
            .Include(a => a.Jobs)
            .FirstOrDefaultAsync(a => a.AssetId == id);

        if (asset == null)
        {
            return NotFound(new { Message = $"Asset com ID '{id}' não foi encontrado." });
        }

        return Ok(asset);
    }

    /// <summary>
    /// Inicia o processo de ingestão assíncrona de uma mídia remota.
    /// </summary>
    [HttpPost("Ingest")]
    public async Task<ActionResult<WorkstationAsset>> IngestMedia([FromBody] IngestMediaRequest request)
    {
        var orderExists = await _context.Orders.AnyAsync(o => o.OrderId == request.OrderId);
        if (!orderExists)
        {
            return NotFound(new { Message = $"Order com ID '{request.OrderId}' não existe." });
        }

        var asset = new WorkstationAsset
        {
            AssetId = Guid.NewGuid(),
            OrderId = request.OrderId,
            Title = request.Title,
            ExternalSourceUrl = request.ExternalSourceUrl,
            OriginalFileName = request.OriginalFileName,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        var job = new MediaProcessingJob
        {
            JobId = Guid.NewGuid(),
            AssetId = asset.AssetId,
            JobType = "IngestDownload",
            Status = "Pending",
            Priority = 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.WorkstationAssets.Add(asset);
        _context.MediaProcessingJobs.Add(job);
        await _context.SaveChangesAsync();

        return AcceptedAtAction(nameof(GetAssetById), new { id = asset.AssetId }, asset);
    }
}
