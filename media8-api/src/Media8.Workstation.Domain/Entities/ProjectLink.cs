namespace Media8.Workstation.Domain.Entities;

/// <summary>
/// Representa um link de mídia ou pasta externa relacionado a um Projeto na Workstation.
/// </summary>
public class ProjectLink
{
    public Guid ProjectLinkId { get; set; } = Guid.NewGuid();
    public Guid ProjectId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string LinkType { get; set; } = "Folder"; // "Folder", "Video", "Audio", "Image", "PDF", "Other"
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Project Project { get; set; } = null!;
}
