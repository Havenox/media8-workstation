namespace Media8.Workstation.Application.DTOs;

public class UserDto
{
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public int AssignedProjectsCount { get; set; }
    public DateTime CreatedAt { get; set; }
}
