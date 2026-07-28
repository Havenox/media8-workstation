namespace Media8.Workstation.Application.DTOs;

/// <summary>
/// DTO de estatísticas e indicadores numéricos consolidados de usuários na estação PAM.
/// </summary>
public class UserStatsDto
{
    public int TotalUsers { get; set; }
    public int AdminCount { get; set; }
    public int EditorCount { get; set; }
}
