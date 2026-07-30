using System.Text.Json.Serialization;

namespace Media8.Workstation.Domain.Entities;

public class WorkstationAsset
{
    public Guid AssetId { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string OriginalFileName { get; set; } = string.Empty;
    public string ExternalSourceUrl { get; set; } = string.Empty;
    public string? ExternalSourceId { get; set; }
    public string? FileHash { get; set; }
    public string? StoragePathHighFidelity { get; set; }
    public string? StoragePathProxy { get; set; }
    public string? WaveformJsonPath { get; set; }
    public long FileSizeBytes { get; set; } = 0;
    public string MimeType { get; set; } = "video/mp4";
    public double DurationSeconds { get; set; } = 0.0;
    public double FrameRate { get; set; } = 29.97;
    public int Width { get; set; } = 0;
    public int Height { get; set; } = 0;
    public int AudioChannels { get; set; } = 2;
    public string TimecodeStart { get; set; } = "00:00:00:00";
    public string Status { get; set; } = "Pending"; // "Pending", "Downloading", "Transcoding", "Ready", "Failed"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Project Project { get; set; } = null!;
    public ICollection<TimecodeMarker> Markers { get; set; } = new List<TimecodeMarker>();
    public ICollection<MediaProcessingJob> Jobs { get; set; } = new List<MediaProcessingJob>();
}
