using System.Text;
using Media8.Workstation.Api.Hubs;
using Media8.Workstation.Infrastructure.Data;
using Media8.Workstation.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// 1. Force PascalCase JSON Serializer Policy (Backend is LEI)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Keeps native C# PascalCase
    });

// 2. Add SignalR for Real-time Notifications
builder.Services.AddSignalR();

// 3. Register JwtTokenService
builder.Services.AddScoped<JwtTokenService>();

// 4. Configure JWT Bearer Authentication
var jwtSecretKey = builder.Configuration["JWT_SECRET_KEY"] ?? "S3cur3S3cr3tKeyM3dia8Workstati0n2026!Min32Chars";
var jwtIssuer = builder.Configuration["JWT_ISSUER"] ?? "Media8Workstation";
var jwtAudience = builder.Configuration["JWT_AUDIENCE"] ?? "Media8WorkstationUsers";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
    };
});

// 5. Smart Database Connection String Resolution
var connectionString = builder.Configuration["DB_CONNECTION_STRING"]
    ?? builder.Configuration.GetConnectionString("PostgreSQL")
    ?? builder.Configuration["DATABASE_URL"];

if (string.IsNullOrWhiteSpace(connectionString))
{
    var host = builder.Configuration["DB_HOST"] ?? "localhost";
    var port = builder.Configuration["DB_PORT"] ?? "5432";
    var db = builder.Configuration["DB_NAME"] ?? "media8_workstation_db";
    var user = builder.Configuration["DB_USERNAME"] ?? "media8_user";
    var pass = builder.Configuration["DB_PASSWORD"] ?? "media8_password_secret";
    connectionString = $"Host={host};Port={port};Database={db};Username={user};Password={pass};Maximum Pool Size=100;";
}

builder.Services.AddDbContext<WorkstationDbContext>(options =>
    options.UseNpgsql(connectionString));

// 6. CORS Configuration for Frontend SPA
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Automatic Database Schema Creation & Initial Admin Seeding on Startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WorkstationDbContext>();
    await db.Database.EnsureCreatedAsync();

    // Seed initial admin user if none exists (Zero hardcoded credentials)
    await DbSeeder.SeedInitialAdminAsync(db, builder.Configuration);
}

app.Run();
