using Media8.Workstation.Worker.Ingestion;
using Media8.Workstation.Worker.Ingestion.Providers;
using Media8.Workstation.Worker.Ingestion.Services;

var builder = Host.CreateApplicationBuilder(args);

// Registro do Cliente HTTP Interno
builder.Services.AddHttpClient<InternalApiClient>();
builder.Services.AddSingleton<InternalApiClient>();

// Registro dos Provedores de Ingestão
builder.Services.AddSingleton<IIngestionProvider, GoogleDriveIngestionProvider>();

// Registro do Hosted Service Background Worker
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
