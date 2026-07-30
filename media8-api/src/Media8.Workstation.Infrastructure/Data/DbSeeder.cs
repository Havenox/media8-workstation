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
            // 0. Ensure Users table has AvatarUrl column
            await dbContext.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE ""Users"" ADD COLUMN IF NOT EXISTS ""AvatarUrl"" text NULL;
            ");
            // 1. Create Projects table if missing
            await dbContext.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ""Projects"" (
                    ""ProjectId"" uuid NOT NULL CONSTRAINT ""PK_Projects"" PRIMARY KEY,
                    ""Title"" character varying(255) NOT NULL,
                    ""BriefingText"" text NULL,
                    ""ExternalOrderReference"" character varying(100) NULL,
                    ""Deadline"" timestamp with time zone NULL,
                    ""Status"" character varying(50) NOT NULL DEFAULT 'InProduction',
                    ""AutoIngest"" boolean NOT NULL DEFAULT true,
                    ""IsDeleted"" boolean NOT NULL DEFAULT false,
                    ""CreatedByUserId"" uuid NOT NULL CONSTRAINT ""FK_Projects_Users_CreatedByUserId"" REFERENCES ""Users"" (""UserId"") ON DELETE RESTRICT,
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
                );
            ");

            // 2. Ensure missing columns on Projects table if created earlier
            await dbContext.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE ""Projects"" ADD COLUMN IF NOT EXISTS ""ExternalOrderReference"" character varying(100) NULL;
                ALTER TABLE ""Projects"" ADD COLUMN IF NOT EXISTS ""Deadline"" timestamp with time zone NULL;
                ALTER TABLE ""Projects"" ADD COLUMN IF NOT EXISTS ""AutoIngest"" boolean NOT NULL DEFAULT true;
                ALTER TABLE ""Projects"" ADD COLUMN IF NOT EXISTS ""IsDeleted"" boolean NOT NULL DEFAULT false;
                ALTER TABLE ""Projects"" ADD COLUMN IF NOT EXISTS ""LeadUserId"" uuid REFERENCES ""Users""(""UserId"") ON DELETE SET NULL;
            ");

            // 3. Create ProjectEditors table if missing
            await dbContext.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ""ProjectEditors"" (
                    ""ProjectEditorId"" uuid NOT NULL CONSTRAINT ""PK_ProjectEditors"" PRIMARY KEY,
                    ""ProjectId"" uuid NOT NULL CONSTRAINT ""FK_ProjectEditors_Projects_ProjectId"" REFERENCES ""Projects"" (""ProjectId"") ON DELETE CASCADE,
                    ""UserId"" uuid NOT NULL CONSTRAINT ""FK_ProjectEditors_Users_UserId"" REFERENCES ""Users"" (""UserId"") ON DELETE CASCADE,
                    ""AssignmentRole"" character varying(50) NOT NULL DEFAULT 'General',
                    ""IsLead"" boolean NOT NULL DEFAULT false,
                    ""AssignedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
                );
                ALTER TABLE ""ProjectEditors"" ADD COLUMN IF NOT EXISTS ""AssignmentRole"" character varying(50) NOT NULL DEFAULT 'General';
                ALTER TABLE ""ProjectEditors"" ADD COLUMN IF NOT EXISTS ""IsLead"" boolean NOT NULL DEFAULT false;
            ");

            // 4. Create ProjectLinks table if missing
            await dbContext.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ""ProjectLinks"" (
                    ""ProjectLinkId"" uuid NOT NULL CONSTRAINT ""PK_ProjectLinks"" PRIMARY KEY,
                    ""ProjectId"" uuid NOT NULL CONSTRAINT ""FK_ProjectLinks_Projects_ProjectId"" REFERENCES ""Projects"" (""ProjectId"") ON DELETE CASCADE,
                    ""Url"" text NOT NULL,
                    ""LinkType"" character varying(50) NOT NULL DEFAULT 'Folder',
                    ""CreatedAt"" timestamp with time zone NOT NULL DEFAULT NOW()
                );
            ");

            // 5. Ensure WorkstationAssets table uses ProjectId and drop NOT NULL constraint from legacy OrderId
            await dbContext.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE ""WorkstationAssets"" ADD COLUMN IF NOT EXISTS ""ProjectId"" uuid REFERENCES ""Projects""(""ProjectId"") ON DELETE CASCADE;
                ALTER TABLE ""WorkstationAssets"" ADD COLUMN IF NOT EXISTS ""ExternalSourceId"" character varying(255) NULL;
                ALTER TABLE ""WorkstationAssets"" ADD COLUMN IF NOT EXISTS ""FileHash"" character varying(100) NULL;
                
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name = 'WorkstationAssets' AND column_name = 'OrderId'
                    ) THEN
                        ALTER TABLE ""WorkstationAssets"" ALTER COLUMN ""OrderId"" DROP NOT NULL;
                    END IF;
                END $$;
            ");

            // 6. Ensure SystemSettings table exists for API Keys and Global Configurations
            await dbContext.Database.ExecuteSqlRawAsync(@"
                CREATE TABLE IF NOT EXISTS ""SystemSettings"" (
                    ""SettingId"" uuid PRIMARY KEY,
                    ""Key"" character varying(150) NOT NULL UNIQUE,
                    ""Value"" text NOT NULL,
                    ""Description"" text NULL,
                    ""UpdatedAt"" timestamp with time zone NOT NULL DEFAULT NOW(),
                    ""UpdatedByUserId"" uuid NULL
                );
            ");

            // 7. Ensure MediaProcessingJobs table allows NULL AssetId and has ProjectId column
            await dbContext.Database.ExecuteSqlRawAsync(@"
                ALTER TABLE ""MediaProcessingJobs"" ADD COLUMN IF NOT EXISTS ""ProjectId"" uuid NULL REFERENCES ""Projects""(""ProjectId"") ON DELETE CASCADE;
                
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 
                        FROM information_schema.columns 
                        WHERE table_name = 'MediaProcessingJobs' AND column_name = 'AssetId'
                    ) THEN
                        ALTER TABLE ""MediaProcessingJobs"" ALTER COLUMN ""AssetId"" DROP NOT NULL;
                    END IF;
                END $$;
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
