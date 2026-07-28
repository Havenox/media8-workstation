namespace Media8.Workstation.Domain.Entities;

public class TimecodeMarker
{
    public Guid MarkerId { get; set; } = Guid.NewGuid();
    public Guid AssetId { get; set; }
    public string InTimecode { get; set; } = "00:00:00:00";
    public string OutTimecode { get; set; } = "00:00:00:00";
    public long InFrame { get; set; } = 0;
    public long OutFrame { get; set; } = 0;
    public string Label { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public string ColorHex { get; set; } = "#FF0000";
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public WorkstationAsset Asset { get; set; } = null!;
    public User CreatedByUser { get; set; } = null!;
}
