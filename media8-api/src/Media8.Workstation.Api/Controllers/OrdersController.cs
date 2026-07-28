using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Api.Controllers;

/// <summary>
/// Controlador responsável pelo gerenciamento de Orders (Projetos de Edição) e RBAC.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class OrdersController(WorkstationDbContext context) : ControllerBase
{
    private readonly WorkstationDbContext _context = context;

    /// <summary>
    /// Lista Orders ativas com suporte a filtragem RBAC por usuário e papel.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Order>>> GetOrders([FromQuery] Guid? userId, [FromQuery] string? role)
    {
        IQueryable<Order> query = _context.Orders
            .Include(o => o.CreatedByUser)
            .Include(o => o.AssignedEditors)
                .ThenInclude(ae => ae.User)
            .Include(o => o.Assets);

        if (string.Equals(role, "Editor", StringComparison.OrdinalIgnoreCase) && userId.HasValue)
        {
            query = query.Where(o => o.AssignedEditors.Any(ae => ae.UserId == userId.Value));
        }

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();
        return Ok(orders);
    }

    /// <summary>
    /// Retorna os detalhes de uma Order específica pelo seu ID.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Order>> GetOrderById(Guid id)
    {
        var order = await _context.Orders
            .Include(o => o.CreatedByUser)
            .Include(o => o.AssignedEditors)
                .ThenInclude(ae => ae.User)
            .Include(o => o.Assets)
                .ThenInclude(a => a.Markers)
            .FirstOrDefaultAsync(o => o.OrderId == id);

        if (order == null)
        {
            return NotFound(new { Message = $"Order com ID '{id}' não foi encontrada." });
        }

        return Ok(order);
    }

    /// <summary>
    /// Cria uma nova Order no banco de dados.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Order>> CreateOrder([FromBody] Order order)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        order.OrderId = Guid.NewGuid();
        order.CreatedAt = DateTime.UtcNow;
        order.UpdatedAt = DateTime.UtcNow;

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrderById), new { id = order.OrderId }, order);
    }
}
