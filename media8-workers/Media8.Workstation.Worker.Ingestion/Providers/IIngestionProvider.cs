using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Media8.Workstation.Domain.Entities;

namespace Media8.Workstation.Worker.Ingestion.Providers;

public class DiscoveredMediaFile
{
    public string ExternalId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string MimeType { get; set; } = string.Empty;
    public long FileSizeBytes { get; set; }
    public string? FileHash { get; set; }
    public string DownloadUrl { get; set; } = string.Empty;
}

public class IngestionProviderResult
{
    public bool Success { get; set; }
    public string ErrorMessage { get; set; } = string.Empty;
    public List<DiscoveredMediaFile> DiscoveredFiles { get; set; } = new();
}

public interface IIngestionProvider
{
    bool CanHandle(string url, string linkType);
    Task<IngestionProviderResult> DiscoverAndDownloadFilesAsync(
        ProjectLink link,
        string apiKey,
        string targetDirectory,
        Func<DiscoveredMediaFile, bool> isAlreadyIngested,
        Func<DiscoveredMediaFile, string, Task> onFileDownloadedAsync,
        CancellationToken cancellationToken);
}
