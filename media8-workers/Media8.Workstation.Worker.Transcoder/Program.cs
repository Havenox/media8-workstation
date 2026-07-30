using Media8.Workstation.Infrastructure.Data;
using Media8.Workstation.Worker.Transcoder;
using Media8.Workstation.Worker.Transcoder.Services;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(args);

// Configuração da Connection String para o PostgreSQL
var connectionString = builder.Configuration["DB_CONNECTION_STRING"]
    ?? builder.Configuration.GetConnectionString("PostgreSQL")
    ?? builder.Configuration["DATABASE_URL"];

if (string.IsNullOrWhiteSpace(connectionString))
{
    var dbHost = builder.Configuration["DB_HOST"] ?? "localhost";
    var dbPort = builder.Configuration["DB_PORT"] ?? "5432";
    var dbName = builder.Configuration["DB_NAME"] ?? "media8_workstation_db";
    var dbUser = builder.Configuration["DB_USERNAME"] ?? "media8_user";
    var dbPass = builder.Configuration["DB_PASSWORD"] ?? "media8_password_secret";
    connectionString = $"Host={dbHost};Port={dbPort};Database={dbName};Username={dbUser};Password={dbPass};Maximum Pool Size=100;";
}

builder.Services.AddDbContext<WorkstationDbContext>(options =>
    options.UseNpgsql(connectionString));

// Registro dos Serviços do Worker Transcoder
builder.Services.AddSingleton<FFprobeService>();
builder.Services.AddSingleton<WaveformExtractorService>();
builder.Services.AddSingleton<DocumentTextExtractorService>();
builder.Services.AddSingleton<TranscoderPipelineService>();

builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
