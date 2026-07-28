using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Api.Controllers;

/// <summary>
/// Controlador responsável pelo gerenciamento de marcadores de timecode e sub-clips.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class TimecodeMarkersController(WorkstationDbContext context) : ControllerBase
{
    private readonly WorkstationDbContext _context = context;

    /// <summary>
    /// Retorna os marcadores de timecode pertencentes a uma mídia.
    /// </summary>
    [HttpGet("Asset/{assetId:guid}")]
    public async Task<ActionResult<IEnumerable<TimecodeMarker>>> GetMarkersByAsset(Guid assetId)
    {
        var markers = await _context.TimecodeMarkers
            .Include(m => m.CreatedByUser)
            .Where(m => m.AssetId == assetId)
            .OrderBy(m => m.InFrame)
            .ToListAsync();

        return Ok(markers);
    }

    /// <summary>
    /// Cria um novo marcador de timecode.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TimecodeMarker>> CreateMarker([FromBody] TimecodeMarker marker)
    {
        var assetExists = await _context.WorkstationAssets.AnyAsync(a => a.AssetId == marker.AssetId);
        if (!assetExists)
        {
            return NotFound(new { Message = $"Asset com ID '{marker.AssetId}' não existe." });
        }

        marker.MarkerId = Guid.NewGuid();
        marker.CreatedAt = DateTime.UtcNow;

        _context.TimecodeMarkers.Add(marker);
        await _context.SaveChangesAsync();

        return Created(string.Empty, marker);
    }

    /// <summary>
    /// Deleta um marcador pelo seu ID.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMarker(Guid id)
    {
        var marker = await _context.TimecodeMarkers.FindAsync(id);
        if (marker == null)
        {
            return NotFound();
        }

        _context.TimecodeMarkers.Remove(marker);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
