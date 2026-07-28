namespace Media8.Workstation.Application.DTOs;

/// <summary>
/// DTO de estatísticas e indicadores numéricos consolidados de projetos na estação PAM.
/// </summary>
public class ProjectStatsDto
{
    public int TotalCount { get; set; }
    public int InProductionCount { get; set; }
    public int InReviewCount { get; set; }
    public int CompletedCount { get; set; }
    public int DraftCount { get; set; }
    public int CancelledCount { get; set; }
}
