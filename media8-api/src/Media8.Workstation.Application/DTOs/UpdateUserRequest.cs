namespace Media8.Workstation.Application.DTOs;

/// <summary>
/// DTO de requisição para atualização de usuário (Admin Only).
/// </summary>
public class UpdateUserRequest
{
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "Editor";
    public string? Password { get; set; }
}
