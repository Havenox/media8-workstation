using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Api.Controllers;

/// <summary>
/// Controlador responsável pelo gerenciamento de Orders (Compatibilidade com ecossistema).
/// </summary>
[Authorize]
public class OrdersController(WorkstationDbContext context) : WorkstationBaseController
{
    private readonly WorkstationDbContext _context = context;

    /// <summary>
    /// Lista as Orders cadastradas no sistema.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetOrders([FromQuery] Guid? userId, [FromQuery] string? role)
    {
        var query = _context.Orders
            .Include(o => o.Assets)
            .AsNoTracking();

        if (role != "Admin" && userId.HasValue)
        {
            query = query.Where(o => o.AssignedEditors.Any(e => e.UserId == userId.Value));
        }

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return Ok(orders);
    }

    /// <summary>
    /// Retorna detalhes de uma Order específica por ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Order>> GetOrderById(Guid id)
    {
        var order = await _context.Orders
            .Include(o => o.Assets)
            .Include(o => o.AssignedEditors)
                .ThenInclude(e => e.User)
            .FirstOrDefaultAsync(o => o.OrderId == id);

        if (order == null) return NotFound();

        return Ok(order);
    }

    /// <summary>
    /// Cria uma nova Order no sistema.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder([FromBody] Order order)
    {
        if (string.IsNullOrWhiteSpace(order.Title))
        {
            return BadRequest(new { Message = "O título da Order é obrigatório." });
        }

        order.OrderId = Guid.NewGuid();
        order.CreatedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrderById), new { id = order.OrderId }, order);
    }
}
