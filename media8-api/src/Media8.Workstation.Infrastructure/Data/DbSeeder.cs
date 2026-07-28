using Media8.Workstation.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

namespace Media8.Workstation.Infrastructure.Data;

public static class DbSeeder
{
    private static readonly PasswordHasher<User> _passwordHasher = new();

    public static async Task EnsureSchemaUpdatedAsync(WorkstationDbContext dbContext)
    {
        try
        {
            // Create Projects table if missing
            await dbContext.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ""Projects"" (
                    ""ProjectId"" uuid NOT NULL CONSTRAINT ""PK_Projects"" PRIMARY KEY,
                    ""Title"" character varying(255) NOT NULL,
                    ""BriefingText"" text NULL,
                    ""ExternalOrderReference"" character varying(100) NULL,
                    ""Deadline"" timestamp with time zone NULL,
                    ""Status"" character varying(50) NOT NULL DEFAULT 'InProduction',
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""CreatedByUserId"" uuid NOT NULL CONSTRAINT ""FK_Projects_Users_CreatedByUserId"" REFERENCES ""Users"" (""UserId"") ON DELETE RESTRICT,
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
                );
            ");

            // Ensure missing columns on Projects table if created earlier
            await dbContext.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE ""Projects"" ADD COLUMN IF NOT EXISTS ""ExternalOrderReference"" character varying(100) NULL;
                ALTER TABLE ""Projects"" ADD COLUMN IF NOT EXISTS ""Deadline"" timestamp with time zone NULL;
                ALTER TABLE ""Projects"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT false;
            ");

            // Create ProjectEditors table if missing
            await dbContext.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ""ProjectEditors"" (
                    ""ProjectEditorId"" uuid NOT NULL CONSTRAINT ""PK_ProjectEditors"" PRIMARY KEY,
                    ""ProjectId"" uuid NOT NULL CONSTRAINT ""FK_ProjectEditors_Projects_ProjectId"" REFERENCES ""Projects"" (""ProjectId"") ON DELETE CASCADE,
                    ""UserId"" uuid NOT NULL CONSTRAINT ""FK_ProjectEditors_Users_UserId"" REFERENCES ""Users"" (""UserId"") ON DELETE CASCADE,
                    ""AssignedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
                );
            ");

            // Create ProjectLinks table if missing
            await dbContext.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ""ProjectLinks"" (
                    ""ProjectLinkId"" uuid NOT NULL CONSTRAINT ""PK_ProjectLinks"" PRIMARY KEY,
                    ""ProjectId"" uuid NOT NULL CONSTRAINT ""FK_ProjectLinks_Projects_ProjectId"" REFERENCES ""Projects"" (""ProjectId"") ON DELETE CASCADE,
                    ""Url"" text NOT NULL,
                    ""LinkType"" character varying(50) NOT NULL DEFAULT 'Folder',
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
                );
            ");

            Console.WriteLine("[DbSeeder] Database Schema successfully verified and updated.");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DbSeeder] Warning during schema update: {ex.Message}");
        }
    }

    public static async Task SeedInitialAdminAsync(WorkstationDbContext dbContext, IConfiguration configuration)
    {
        try
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
            Console.WriteLine($"[DbSeeder] Initial Admin successfully seeded: {adminEmail}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[DbSeeder] Exception during initial admin seeding: {ex.Message}");
        }
    }
}
