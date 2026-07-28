using System.Security.Claims;
using Media8.Workstation.Application.DTOs;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Media8.Workstation.Infrastructure.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(WorkstationDbContext context, JwtTokenService tokenService) : ControllerBase
{
    private static readonly PasswordHasher<User> _passwordHasher = new();

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<AuthResponse>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { Message = "Email e senha são obrigatórios." });
        }

        var user = await context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower());

        if (user == null)
        {
            return Unauthorized(new { Message = "Credenciais inválidas." });
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new { Message = "Credenciais inválidas." });
        }

        var token = tokenService.GenerateToken(user);

        return Ok(new AuthResponse
        {
            Token = token,
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role
        });
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        return Ok(new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        });
    }

    [HttpPost("change-password")]
    [Authorize]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var user = await context.Users.FindAsync(userId);
        if (user == null)
        {
            return NotFound();
        }

        var verificationResult = _passwordHasher.VerifyHashedPassword(user, user.PasswordHash, request.CurrentPassword);
        if (verificationResult == PasswordVerificationResult.Failed)
        {
            return BadRequest(new { Message = "A senha atual está incorreta." });
        }

        user.PasswordHash = _passwordHasher.HashPassword(user, request.NewPassword);
        await context.SaveChangesAsync();

        return Ok(new { Message = "Senha alterada com sucesso." });
    }
}
