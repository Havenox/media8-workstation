using Media8.Workstation.Worker.Transcoder;
using Media8.Workstation.Worker.Transcoder.Services;

var builder = Host.CreateApplicationBuilder(args);

// Registro do Cliente HTTP Interno
builder.Services.AddHttpClient<InternalApiClient>();
builder.Services.AddSingleton<InternalApiClient>();

// Registro dos Serviços do Worker Transcoder
builder.Services.AddSingleton<FFprobeService>();
builder.Services.AddSingleton<WaveformExtractorService>();
builder.Services.AddSingleton<DocumentTextExtractorService>();
builder.Services.AddSingleton<TranscoderPipelineService>();

builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
