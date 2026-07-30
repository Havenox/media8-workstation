using System.Text.Json.Serialization;

namespace Media8.Workstation.Domain.Entities;

public class MediaProcessingJob
{
    public Guid JobId { get; set; } = Guid.NewGuid();
    public Guid? ProjectId { get; set; }
    public Guid? AssetId { get; set; }
    public string JobType { get; set; } = string.Empty; // "IngestDownload", "GenerateHighFidelity", "GenerateProxy", "ExtractWaveform", "CutSubClip"
    public string Status { get; set; } = "Pending"; // "Pending", "Processing", "Completed", "Failed"
    public int Priority { get; set; } = 10;
    public int Attempts { get; set; } = 0;
    public int MaxAttempts { get; set; } = 3;
    public string? ErrorMessage { get; set; }
    public string? LockedByWorkerId { get; set; }
    public DateTime? LockedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Project? Project { get; set; }

    [JsonIgnore]
    public WorkstationAsset? Asset { get; set; }
}
