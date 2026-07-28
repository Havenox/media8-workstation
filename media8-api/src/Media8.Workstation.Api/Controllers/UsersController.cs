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
    /// Lista todos os usuários cadastrados no sistema.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new UserDto
            {
                UserId = u.UserId,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role,
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(users);
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
}
