using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Api.Controllers;

/// <summary>
/// Controlador responsável pelo gerenciamento de marcadores de timecode (Sub-clips).
/// </summary>
[Authorize]
public class TimecodeMarkersController(WorkstationDbContext context) : WorkstationBaseController
{
    private readonly WorkstationDbContext _context = context;

    /// <summary>
    /// Lista os marcadores de uma mídia específica.
    /// </summary>
    [HttpGet("Asset/{assetId:guid}")]
    public async Task<ActionResult<IEnumerable<TimecodeMarker>>> GetMarkersByAsset(Guid assetId)
    {
        var markers = await _context.TimecodeMarkers
            .Where(m => m.AssetId == assetId)
            .OrderBy(m => m.InFrame)
            .ToListAsync();

        return Ok(markers);
    }

    /// <summary>
    /// Salva um novo marcador de timecode para a mídia.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<TimecodeMarker>> CreateMarker([FromBody] TimecodeMarker marker)
    {
        if (string.IsNullOrWhiteSpace(marker.Label))
        {
            return BadRequest(new { Message = "O rótulo do marcador é obrigatório." });
        }

        marker.MarkerId = Guid.NewGuid();
        marker.CreatedAt = DateTime.UtcNow;

        _context.TimecodeMarkers.Add(marker);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetMarkersByAsset), new { assetId = marker.AssetId }, marker);
    }

    /// <summary>
    /// Remove um marcador de timecode por ID.
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteMarker(Guid id)
    {
        var marker = await _context.TimecodeMarkers.FindAsync(id);
        if (marker == null) return NotFound();

        _context.TimecodeMarkers.Remove(marker);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
