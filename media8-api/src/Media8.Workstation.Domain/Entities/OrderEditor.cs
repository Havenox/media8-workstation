namespace Media8.Workstation.Domain.Entities;

public class OrderEditor
{
    public Guid OrderEditorId { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Guid UserId { get; set; }
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    public Order Order { get; set; } = null!;
    public User User { get; set; } = null!;
}
