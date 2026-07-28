namespace Media8.Workstation.Domain.Entities;

public class Order
{
    public Guid OrderId { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string? BriefingText { get; set; }
    public string Status { get; set; } = "Draft"; // "Draft", "InProduction", "InReview", "Completed", "Cancelled"
    public Guid CreatedByUserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User CreatedByUser { get; set; } = null!;
    public ICollection<OrderEditor> AssignedEditors { get; set; } = new List<OrderEditor>();
    public ICollection<WorkstationAsset> Assets { get; set; } = new List<WorkstationAsset>();
}
