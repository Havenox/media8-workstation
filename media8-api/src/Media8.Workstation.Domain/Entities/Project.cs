using System.Text.Json.Serialization;

namespace Media8.Workstation.Domain.Entities;

/// <summary>
/// Entidade de Projeto operacional de edição na Workstation.
/// </summary>
public class Project
{
    public Guid ProjectId { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string? BriefingText { get; set; }
    public string? ExternalOrderReference { get; set; } // Chave fria / Alias do CRM (ex: #0254 ou ORD-9981)
    public DateTime? Deadline { get; set; } // Prazo de Entrega do Projeto
    public string Status { get; set; } = "InProduction"; // "Draft", "InProduction", "InReview", "Completed", "Cancelled"
    public bool AutoIngest { get; set; } = true; // Ingestão automática ativada por padrão ao registrar links
    public bool IsDeleted { get; set; } = false; // Suporte a Soft Delete
    public Guid CreatedByUserId { get; set; }
    public Guid? LeadUserId { get; set; } // ID do Editor Responsável do Projeto
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public User CreatedByUser { get; set; } = null!;
    public User? LeadUser { get; set; }
    public ICollection<ProjectEditor> AssignedEditors { get; set; } = new List<ProjectEditor>();
    public ICollection<WorkstationAsset> Assets { get; set; } = new List<WorkstationAsset>();
    public ICollection<ProjectLink> Links { get; set; } = new List<ProjectLink>();
}

/// <summary>
/// Junção de atribuição entre Editores, Projetos e Funções de Produção (PAM).
/// </summary>
public class ProjectEditor
{
    public Guid ProjectEditorId { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public Guid UserId { get; set; }
    public string AssignmentRole { get; set; } = "General"; // "General", "Decoupage", "AudioTreatment", "ColorGrading", "MotionGraphics", "Reviewer"
    public bool IsLead { get; set; } = false;
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    [JsonIgnore]
    public Project Project { get; set; } = null!;
    public User User { get; set; } = null!;
}
