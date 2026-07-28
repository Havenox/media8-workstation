using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Media8.Workstation.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace Media8.Workstation.Infrastructure.Services;

public class JwtTokenService(IConfiguration configuration)
{
    public string GenerateToken(User user)
    {
        var secretKey = configuration["JWT_SECRET_KEY"] ?? "S3cur3S3cr3tKeyM3dia8Workstati0n2026!Min32Chars";
        var issuer = configuration["JWT_ISSUER"] ?? "Media8Workstation";
        var audience = configuration["JWT_AUDIENCE"] ?? "Media8WorkstationUsers";

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Name),
            new Claim(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
