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

/// <summary>
/// Controlador responsável pelo fluxo de autenticação pública e gerenciamento de perfil/senha.
/// </summary>
public class AuthController(WorkstationDbContext context, JwtTokenService tokenService) : WorkstationBaseController
{
    private static readonly PasswordHasher<User> _passwordHasher = new();

    /// <summary>
    /// Realiza a autenticação de usuários cadastrados e emite um token Bearer JWT.
    /// </summary>
    /// <param name="request">DTO contendo Email e Password do usuário.</param>
    /// <returns>AuthResponse em PascalCase com Token JWT e perfil do usuário.</returns>
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

        Response?.Cookies?.Append("media8_auth", token, new CookieOptions
        {
            HttpOnly = true,
            Secure = false, // Set to false in dev or true in production behind HTTPS
            SameSite = SameSiteMode.Lax,
            Expires = DateTimeOffset.UtcNow.AddDays(7)
        });

        return Ok(new AuthResponse
        {
            Token = token,
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl
        });
    }

    /// <summary>
    /// Retorna as informações do perfil do usuário atualmente autenticado.
    /// </summary>
    /// <returns>UserDto em PascalCase com o perfil do usuário ativo.</returns>
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
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt
        });
    }

    /// <summary>
    /// Altera a senha do usuário autenticado após validar a senha atual.
    /// </summary>
    /// <param name="request">DTO com a senha atual e a nova senha desejada.</param>
    /// <returns>Mensagem de sucesso na alteração da senha.</returns>
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
