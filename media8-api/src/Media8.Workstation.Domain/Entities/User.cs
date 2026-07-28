namespace Media8.Workstation.Domain.Entities;

public class User
{
    public Guid UserId { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Editor"; // "Admin", "Editor"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Order> CreatedOrders { get; set; } = new List<Order>();
    public ICollection<OrderEditor> AssignedOrders { get; set; } = new List<OrderEditor>();
    public ICollection<TimecodeMarker> Markers { get; set; } = new List<TimecodeMarker>();
}
