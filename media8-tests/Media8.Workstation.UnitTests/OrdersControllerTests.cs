using Media8.Workstation.Api.Controllers;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace Media8.Workstation.UnitTests;

public class OrdersControllerTests
{
    private WorkstationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<WorkstationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new WorkstationDbContext(options);
    }

    [Fact]
    public async Task GetOrders_ReturnsEmptyList_WhenNoOrdersExist()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var controller = new OrdersController(context);

        // Act
        var result = await controller.GetOrders(null, null);

        // Assert
        var actionResult = Assert.IsType<OkObjectResult>(result.Result);
        var orders = Assert.IsAssignableFrom<IEnumerable<Order>>(actionResult.Value);
        Assert.Empty(orders);
    }

    [Fact]
    public async Task CreateOrder_PersistsOrderInDatabase()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var user = new User
        {
            UserId = Guid.NewGuid(),
            Name = "Admin User",
            Email = "admin@media8.com",
            PasswordHash = "hash123",
            Role = "Admin"
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var controller = new OrdersController(context);
        var newOrder = new Order
        {
            Title = "Podcast Edição #01",
            BriefingText = "Cortar apenas trechos marcados.",
            CreatedByUserId = user.UserId,
            Status = "InProduction"
        };

        // Act
        var result = await controller.CreateOrder(newOrder);

        // Assert
        var actionResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var createdOrder = Assert.IsType<Order>(actionResult.Value);
        Assert.Equal("Podcast Edição #01", createdOrder.Title);

        var dbOrder = await context.Orders.FirstOrDefaultAsync(o => o.OrderId == createdOrder.OrderId);
        Assert.NotNull(dbOrder);
        Assert.Equal("Podcast Edição #01", dbOrder.Title);
    }
}
