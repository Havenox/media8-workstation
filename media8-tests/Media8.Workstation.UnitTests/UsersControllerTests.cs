using Media8.Workstation.Api.Controllers;
using Media8.Workstation.Application.DTOs;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.UnitTests;

public class UsersControllerTests
{
    private static WorkstationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WorkstationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new WorkstationDbContext(options);
    }

    [Fact]
    public async Task GetUsers_ReturnsAllRegisteredUsers()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        context.Users.Add(new User { UserId = Guid.NewGuid(), Name = "Alice", Email = "alice@media8.com", Role = "Admin" });
        context.Users.Add(new User { UserId = Guid.NewGuid(), Name = "Bob", Email = "bob@media8.com", Role = "Editor" });
        await context.SaveChangesAsync();

        var controller = new UsersController(context);

        // Act
        var result = await controller.GetUsers();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var users = Assert.IsAssignableFrom<IEnumerable<UserDto>>(okResult.Value);
        Assert.Equal(2, users.Count());
    }

    [Fact]
    public async Task CreateUser_WithValidData_ReturnsCreatedUser()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var controller = new UsersController(context);
        var createRequest = new CreateUserRequest
        {
            Name = "Novo Editor",
            Email = "novo.editor@media8.com",
            Password = "SenhaSegura123!",
            Role = "Editor"
        };

        // Act
        var result = await controller.CreateUser(createRequest);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var userDto = Assert.IsType<UserDto>(createdResult.Value);
        Assert.Equal("Novo Editor", userDto.Name);
        Assert.Equal("novo.editor@media8.com", userDto.Email);
        Assert.Equal("Editor", userDto.Role);

        // Verify persisted in DB with hashed password
        var dbUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "novo.editor@media8.com");
        Assert.NotNull(dbUser);
        Assert.NotEqual("SenhaSegura123!", dbUser.PasswordHash);
    }

    [Fact]
    public async Task CreateUser_WithDuplicateEmail_ReturnsBadRequest()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        context.Users.Add(new User { UserId = Guid.NewGuid(), Name = "Existente", Email = "existente@media8.com", Role = "Editor" });
        await context.SaveChangesAsync();

        var controller = new UsersController(context);
        var createRequest = new CreateUserRequest
        {
            Name = "Duplicado",
            Email = "existente@media8.com",
            Password = "Senha123!",
            Role = "Editor"
        };

        // Act
        var result = await controller.CreateUser(createRequest);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result.Result);
    }
}
