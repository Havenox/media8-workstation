using System.Security.Claims;
using Media8.Workstation.Api.Controllers;
using Media8.Workstation.Application.DTOs;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;

using Microsoft.Extensions.Configuration;

namespace Media8.Workstation.UnitTests;

public class TestHostEnvironment : IWebHostEnvironment
{
    public string ApplicationName { get; set; } = "TestApp";
    public IFileProvider ContentRootFileProvider { get; set; } = null!;
    public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
    public string EnvironmentName { get; set; } = "Development";
    public IFileProvider WebRootFileProvider { get; set; } = null!;
    public string WebRootPath { get; set; } = Directory.GetCurrentDirectory();
}

public class UsersControllerTests
{
    private WorkstationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WorkstationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new WorkstationDbContext(options);
    }

    private UsersController CreateControllerWithUserClaims(WorkstationDbContext context, Guid userId, string role)
    {
        var env = new TestHostEnvironment();
        var config = new ConfigurationBuilder().Build();
        var controller = new UsersController(context, env, config);
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuthType");
        var claimsPrincipal = new ClaimsPrincipal(identity);

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };

        return controller;
    }

    [Fact]
    public async Task GetUsers_ReturnsPagedResultWithFilterAndSearch()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();
        var controller = CreateControllerWithUserClaims(context, adminId, "Admin");

        context.Users.Add(new User { UserId = Guid.NewGuid(), Name = "Alice Admin", Email = "alice@media8.com", Role = "Admin", CreatedAt = DateTime.UtcNow });
        context.Users.Add(new User { UserId = Guid.NewGuid(), Name = "Bob Editor", Email = "bob@media8.com", Role = "Editor", CreatedAt = DateTime.UtcNow });
        context.Users.Add(new User { UserId = Guid.NewGuid(), Name = "Carlos Editor", Email = "carlos@media8.com", Role = "Editor", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        // Act
        var result = await controller.GetUsers(page: 1, pageSize: 20, search: "bob", role: "ALL");

        // Assert
        var actionResult = Assert.IsType<OkObjectResult>(result.Result);
        var pagedResult = Assert.IsType<PagedResultDto<UserDto>>(actionResult.Value);

        var itemsList = pagedResult.Items.ToList();
        Assert.Single(itemsList);
        Assert.Equal("Bob Editor", itemsList[0].Name);
        Assert.Equal(1, pagedResult.TotalCount);
    }

    [Fact]
    public async Task GetUserStats_ReturnsCorrectCounts()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();
        var controller = CreateControllerWithUserClaims(context, adminId, "Admin");

        context.Users.Add(new User { UserId = Guid.NewGuid(), Name = "Admin 1", Email = "a1@m8.com", Role = "Admin", CreatedAt = DateTime.UtcNow });
        context.Users.Add(new User { UserId = Guid.NewGuid(), Name = "Editor 1", Email = "e1@m8.com", Role = "Editor", CreatedAt = DateTime.UtcNow });
        context.Users.Add(new User { UserId = Guid.NewGuid(), Name = "Editor 2", Email = "e2@m8.com", Role = "Editor", CreatedAt = DateTime.UtcNow });
        await context.SaveChangesAsync();

        // Act
        var result = await controller.GetUserStats();

        // Assert
        var actionResult = Assert.IsType<OkObjectResult>(result.Result);
        var stats = Assert.IsType<UserStatsDto>(actionResult.Value);

        Assert.Equal(3, stats.TotalUsers);
        Assert.Equal(1, stats.AdminCount);
        Assert.Equal(2, stats.EditorCount);
    }

    [Fact]
    public async Task UpdateUser_UpdatesNameRoleAndEmail_WhenValid()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var adminId = Guid.NewGuid();
        var controller = CreateControllerWithUserClaims(context, adminId, "Admin");

        var user = new User { UserId = Guid.NewGuid(), Name = "Old Name", Email = "old@m8.com", Role = "Editor", CreatedAt = DateTime.UtcNow };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var request = new UpdateUserRequest
        {
            Name = "New Name",
            Email = "new@m8.com",
            Role = "Admin",
            Password = "newpassword123"
        };

        // Act
        var result = await controller.UpdateUser(user.UserId, request);

        // Assert
        var actionResult = Assert.IsType<OkObjectResult>(result.Result);
        var updated = Assert.IsType<UserDto>(actionResult.Value);

        Assert.Equal("New Name", updated.Name);
        Assert.Equal("new@m8.com", updated.Email);
        Assert.Equal("Admin", updated.Role);

        var dbUser = await context.Users.FindAsync(user.UserId);
        Assert.NotNull(dbUser);
        Assert.Equal("New Name", dbUser.Name);
    }
}
