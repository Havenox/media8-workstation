using Media8.Workstation.Api.Controllers;
using Media8.Workstation.Application.DTOs;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Media8.Workstation.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Media8.Workstation.UnitTests;

public class AuthControllerTests
{
    private static WorkstationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WorkstationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new WorkstationDbContext(options);
    }

    private static IConfiguration GetTestConfiguration()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            {"JWT_SECRET_KEY", "S3cur3S3cr3tKeyM3dia8Workstati0n2026!Min32Chars"},
            {"JWT_ISSUER", "Media8Workstation"},
            {"JWT_AUDIENCE", "Media8WorkstationUsers"}
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsOkWithToken()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var config = GetTestConfiguration();
        var tokenService = new JwtTokenService(config);
        var passwordHasher = new PasswordHasher<User>();

        var testUser = new User
        {
            UserId = Guid.NewGuid(),
            Name = "Editor Teste",
            Email = "editor@media8.com",
            Role = "Editor",
            CreatedAt = DateTime.UtcNow
        };
        testUser.PasswordHash = passwordHasher.HashPassword(testUser, "SenhaValida123!");
        context.Users.Add(testUser);
        await context.SaveChangesAsync();

        var controller = new AuthController(context, tokenService);
        var loginRequest = new LoginRequest
        {
            Email = "editor@media8.com",
            Password = "SenhaValida123!"
        };

        // Act
        var result = await controller.Login(loginRequest);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var authResponse = Assert.IsType<AuthResponse>(okResult.Value);
        Assert.False(string.IsNullOrWhiteSpace(authResponse.Token));
        Assert.Equal(testUser.UserId, authResponse.UserId);
        Assert.Equal("editor@media8.com", authResponse.Email);
        Assert.Equal("Editor", authResponse.Role);
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var config = GetTestConfiguration();
        var tokenService = new JwtTokenService(config);
        var passwordHasher = new PasswordHasher<User>();

        var testUser = new User
        {
            UserId = Guid.NewGuid(),
            Name = "Admin Teste",
            Email = "admin@media8.com",
            Role = "Admin",
            CreatedAt = DateTime.UtcNow
        };
        testUser.PasswordHash = passwordHasher.HashPassword(testUser, "SenhaCorreta!");
        context.Users.Add(testUser);
        await context.SaveChangesAsync();

        var controller = new AuthController(context, tokenService);
        var loginRequest = new LoginRequest
        {
            Email = "admin@media8.com",
            Password = "SenhaErrada!"
        };

        // Act
        var result = await controller.Login(loginRequest);

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }
}
