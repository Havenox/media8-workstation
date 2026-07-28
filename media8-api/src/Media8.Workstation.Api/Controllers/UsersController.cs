using Media8.Workstation.Application.DTOs;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Api.Controllers;

/// <summary>
/// Controlador responsável pelo gerenciamento de Usuários e permissões RBAC.
/// </summary>
[Authorize]
public class UsersController(WorkstationDbContext context) : WorkstationBaseController
{
    private static readonly PasswordHasher<User> _passwordHasher = new();

    /// <summary>
    /// Obtém estatísticas consolidadas numéricas dos usuários cadastrados no sistema.
    /// </summary>
    [HttpGet("Stats")]
    public async Task<ActionResult<UserStatsDto>> GetUserStats()
    {
        var totalUsers = await context.Users.CountAsync();
        var adminCount = await context.Users.CountAsync(u => u.Role == "Admin");
        var editorCount = await context.Users.CountAsync(u => u.Role == "Editor");

        return Ok(new UserStatsDto
        {
            TotalUsers = totalUsers,
            AdminCount = adminCount,
            EditorCount = editorCount
        });
    }

    /// <summary>
    /// Lista os usuários com suporte a paginação (20 em 20), busca e filtros por papel.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<UserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null)
    {
        var query = context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(role) && role.ToUpper() != "ALL")
        {
            query = query.Where(u => u.Role == role);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanSearch = search.Trim().ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(cleanSearch) ||
                u.Email.ToLower().Contains(cleanSearch));
        }

        var totalCount = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto
            {
                UserId = u.UserId,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(new PagedResultDto<UserDto>
        {
            Items = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Cadastra um novo usuário no sistema (Exclusivo para Administradores).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { Message = "Nome, e-mail e senha são obrigatórios." });
        }

        var exists = await context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower());
        if (exists)
        {
            return BadRequest(new { Message = "E-mail já cadastrado no sistema." });
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim().ToLower(),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "Editor" : request.Role,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUsers), new { id = user.UserId }, new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        });
    }

    /// <summary>
    /// Atualiza o perfil e permissões de um usuário existente (Exclusivo para Administradores).
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.UserId == id);
        if (user == null) return NotFound(new { Message = "Usuário não encontrado." });

        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { Message = "Nome e e-mail são obrigatórios." });
        }

        var emailClean = request.Email.Trim().ToLower();
        var emailTaken = await context.Users.AnyAsync(u => u.UserId != id && u.Email.ToLower() == emailClean);
        if (emailTaken)
        {
            return BadRequest(new { Message = "O e-mail informado já está em uso por outro usuário." });
        }

        user.Name = request.Name.Trim();
        user.Email = emailClean;
        user.Role = string.IsNullOrWhiteSpace(request.Role) ? "Editor" : request.Role;

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        }

        await context.SaveChangesAsync();

        return Ok(new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        });
    }
}
