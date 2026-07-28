using Media8.Workstation.Application.DTOs;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController(WorkstationDbContext context) : ControllerBase
{
    private static readonly PasswordHasher<User> _passwordHasher = new();

    [HttpGet]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetUsers()
    {
        var users = await context.Users
            .AsNoTracking()
            .OrderBy(u => u.Name)
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

    [HttpPost]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password) || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(new { Message = "Nome, Email e Senha são obrigatórios." });
        }

        var emailExists = await context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower());
        if (emailExists)
        {
            return BadRequest(new { Message = "Já existe um usuário cadastrado com este e-mail." });
        }

        var role = request.Role == "Admin" ? "Admin" : "Editor";

        var user = new User
        {
            UserId = Guid.NewGuid(),
            Name = request.Name.Trim(),
            Email = request.Email.Trim(),
            Role = role,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUsers), new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        });
    }
}
