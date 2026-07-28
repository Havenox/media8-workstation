using Media8.Workstation.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Media8.Workstation.Infrastructure.Data;

public static class DbSeeder
{
    private static readonly PasswordHasher<User> _passwordHasher = new();

    public static async Task SeedInitialAdminAsync(WorkstationDbContext dbContext, IConfiguration configuration)
    {
        // 1. Check if any user with Role == "Admin" already exists in database
        var hasAdmin = await dbContext.Users.AnyAsync(u => u.Role == "Admin");
        if (hasAdmin)
        {
            return; // Admin user already seeded or created
        }

        // 2. Read credentials from configuration / environment variables
        var adminEmail = configuration["INITIAL_ADMIN_EMAIL"] ?? "admin@media8.com";
        var adminPassword = configuration["INITIAL_ADMIN_PASSWORD"] ?? "SenhaAdminSegura123!";

        // 3. Create and hash initial Admin user
        var adminUser = new User
        {
            UserId = Guid.NewGuid(),
            Name = "Administrador Media 8",
            Email = adminEmail.Trim(),
            Role = "Admin",
            CreatedAt = DateTime.UtcNow
        };

        adminUser.PasswordHash = _passwordHasher.HashPassword(adminUser, adminPassword);

        dbContext.Users.Add(adminUser);
        await dbContext.SaveChangesAsync();
    }
}
