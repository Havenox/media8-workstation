using Media8.Workstation.Api.Hubs;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 1. Force PascalCase JSON Serializer Policy (Backend is LEI)
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = null; // Keeps native C# PascalCase
    });

// 2. Add SignalR for Real-time Notifications
builder.Services.AddSignalR();

// 3. Smart Database Connection String Resolution
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

// 4. CORS Configuration for Frontend SPA
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

app.UseAuthorization();

app.MapControllers();
app.MapHub<NotificationHub>("/hubs/notifications");

// Automatic Migration Execution on Startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<WorkstationDbContext>();
    db.Database.Migrate();
}

app.Run();
