using Media8.Workstation.Infrastructure.Data;
using Media8.Workstation.Worker.Transcoder;
using Media8.Workstation.Worker.Transcoder.Services;
using Microsoft.EntityFrameworkCore;

var builder = Host.CreateApplicationBuilder(args);

// Configuração do PostgreSQL DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                       ?? builder.Configuration["DATABASE_URL"]
                       ?? "Host=localhost;Port=5432;Database=media8_workstation_db;Username=postgres;Password=postgres";

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
