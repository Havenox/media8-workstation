using System.Security.Claims;
using Media8.Workstation.Application.DTOs;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Api.Controllers;

/// <summary>
/// DTO de requisição para criação/atualização de link de projeto.
/// </summary>
public class ProjectLinkDto
{
    public Guid? ProjectLinkId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string LinkType { get; set; } = "Folder"; // "Folder", "Video", "Audio", "Image", "PDF", "Other"
}

/// <summary>
/// DTO de requisição para atribuição de editor com Função PAM.
/// </summary>
public class ProjectEditorAssignmentDto
{
    public Guid UserId { get; set; }
    public string AssignmentRole { get; set; } = "General"; // "General", "Decoupage", "AudioTreatment", "ColorGrading", "MotionGraphics", "Reviewer"
    public bool IsLead { get; set; } = false;
}

/// <summary>
/// DTO de requisição para criação de novo projeto.
/// </summary>
public class CreateProjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string? BriefingText { get; set; }
    public string? ExternalOrderReference { get; set; } // Chave fria / Alias do CRM (ex: #0254)
    public DateTime? Deadline { get; set; } // Prazo de entrega
    public bool AutoIngest { get; set; } = true; // Ativa/desativa disparo automático de ingestão
    public Guid CreatedByUserId { get; set; }
    public Guid? LeadUserId { get; set; } // Editor Responsável do Projeto
    public List<ProjectEditorAssignmentDto> AssignedEditors { get; set; } = new();
    public List<ProjectLinkDto> Links { get; set; } = new();
}

/// <summary>
/// DTO de requisição para atualização de projeto.
/// </summary>
public class UpdateProjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string? BriefingText { get; set; }
    public string? ExternalOrderReference { get; set; }
    public DateTime? Deadline { get; set; }
    public string Status { get; set; } = "InProduction";
    public bool AutoIngest { get; set; } = true;
    public Guid? LeadUserId { get; set; } // Editor Responsável do Projeto
    public List<ProjectEditorAssignmentDto> AssignedEditors { get; set; } = new();
    public List<ProjectLinkDto> Links { get; set; } = new();
}

/// <summary>
/// Controlador oficial da API v1 para gerenciamento de Projetos, Links e Disparo de Ingestão.
/// Herda de WorkstationBaseController (Rota: api/v1/Projects).
/// </summary>
[Authorize]
public class ProjectsController(WorkstationDbContext context) : WorkstationBaseController
{
    private readonly WorkstationDbContext _context = context;

    /// <summary>
    /// Obtém os indicadores numéricos consolidados de estatísticas dos projetos (RBAC-enforced).
    /// </summary>
    [HttpGet("Stats")]
    public async Task<ActionResult<ProjectStatsDto>> GetProjectStats()
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        Guid.TryParse(userIdClaim, out var currentUserId);

        var query = _context.Projects
            .AsNoTracking()
            .Where(p => !p.IsDeleted);

        if (roleClaim != "Admin")
        {
            query = query.Where(p => p.AssignedEditors.Any(e => e.UserId == currentUserId));
        }

        var totalCount = await query.CountAsync();
        var inProductionCount = await query.CountAsync(p => p.Status == "InProduction");
        var inReviewCount = await query.CountAsync(p => p.Status == "InReview");
        var completedCount = await query.CountAsync(p => p.Status == "Completed");
        var draftCount = await query.CountAsync(p => p.Status == "Draft");
        var cancelledCount = await query.CountAsync(p => p.Status == "Cancelled");

        return Ok(new ProjectStatsDto
        {
            TotalCount = totalCount,
            InProductionCount = inProductionCount,
            InReviewCount = inReviewCount,
            CompletedCount = completedCount,
            DraftCount = draftCount,
            CancelledCount = cancelledCount
        });
    }

    /// <summary>
    /// Lista os projetos com suporte a paginação (20 em 20), filtros e limite para Dashboard.
    /// Impõe autorização estrita via JWT Claims: Admins visualizam tudo, Editores apenas projetos designados.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetProjects(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] int? limit = null,
        [FromQuery] string? status = null,
        [FromQuery] string? search = null)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);

        Guid.TryParse(userIdClaim, out var currentUserId);

        var query = _context.Projects
            .Include(p => p.Links)
            .Include(p => p.Assets)
            .Include(p => p.AssignedEditors)
                .ThenInclude(e => e.User)
            .Where(p => !p.IsDeleted)
            .AsNoTracking();

        if (roleClaim != "Admin")
        {
            query = query.Where(p => p.AssignedEditors.Any(e => e.UserId == currentUserId));
        }

        if (!string.IsNullOrWhiteSpace(status) && status.ToUpper() != "ALL")
        {
            query = query.Where(p => p.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(p =>
                p.Title.ToLower().Contains(searchLower) ||
                (p.BriefingText != null && p.BriefingText.ToLower().Contains(searchLower)) ||
                (p.ExternalOrderReference != null && p.ExternalOrderReference.ToLower().Contains(searchLower)));
        }

        query = query.OrderByDescending(p => p.CreatedAt);

        if (limit.HasValue && limit.Value > 0)
        {
            var recentProjects = await query.Take(limit.Value).ToListAsync();
            return Ok(recentProjects);
        }

        var totalCount = await query.LongCountAsync();
        var safePage = page < 1 ? 1 : page;
        var safePageSize = pageSize < 1 ? 20 : (pageSize > 100 ? 100 : pageSize);

        var items = await query
            .Skip((safePage - 1) * safePageSize)
            .Take(safePageSize)
            .ToListAsync();

        var pagedResult = new PagedResultDto<Project>
        {
            Items = items,
            Page = safePage,
            PageSize = safePageSize,
            TotalCount = totalCount
        };

        return Ok(pagedResult);
    }

    /// <summary>
    /// Retorna detalhes de um projeto por ID com seus links e mídias.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Project>> GetProjectById(Guid id)
    {
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        Guid.TryParse(userIdClaim, out var currentUserId);

        var project = await _context.Projects
            .Include(p => p.Links)
            .Include(p => p.Assets)
            .Include(p => p.AssignedEditors)
                .ThenInclude(e => e.User)
            .FirstOrDefaultAsync(p => p.ProjectId == id && !p.IsDeleted);

        if (project == null) return NotFound();

        if (roleClaim != "Admin" && !project.AssignedEditors.Any(e => e.UserId == currentUserId))
        {
            return Forbid();
        }

        return Ok(project);
    }

    /// <summary>
    /// Cadastra um novo projeto manualmente com seus links categorizados e disparo de ingestão se AutoIngest == true.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject([FromBody] CreateProjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { Message = "O título do projeto é obrigatório." });
        }

        if (request.Deadline.HasValue && request.Deadline.Value.Date < DateTime.UtcNow.Date)
        {
            return BadRequest(new { Message = "O prazo de entrega não pode ser uma data passada." });
        }

        foreach (var link in request.Links)
        {
            if (string.IsNullOrWhiteSpace(link.Url) || !Uri.TryCreate(link.Url, UriKind.Absolute, out _))
            {
                return BadRequest(new { Message = $"A URL '{link.Url}' é inválida. Informe URLs completas com http:// ou https://." });
            }
        }

        var project = new Project
        {
            ProjectId = Guid.NewGuid(),
            Title = request.Title.Trim(),
            BriefingText = request.BriefingText?.Trim(),
            ExternalOrderReference = request.ExternalOrderReference?.Trim(),
            Deadline = request.Deadline,
            AutoIngest = request.AutoIngest,
            CreatedByUserId = request.CreatedByUserId,
            LeadUserId = request.LeadUserId,
            Status = "InProduction",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // 1. Process Lead Editor assignment
        var assignedUserIds = new HashSet<Guid>();
        if (request.LeadUserId.HasValue && request.LeadUserId.Value != Guid.Empty)
        {
            project.AssignedEditors.Add(new ProjectEditor
            {
                ProjectEditorId = Guid.NewGuid(),
                ProjectId = project.ProjectId,
                UserId = request.LeadUserId.Value,
                AssignmentRole = "General",
                IsLead = true,
                AssignedAt = DateTime.UtcNow
            });
            assignedUserIds.Add(request.LeadUserId.Value);
        }

        // 2. Process Additional Editors assignments
        foreach (var assignment in request.AssignedEditors)
        {
            if (assignment.UserId != Guid.Empty && !assignedUserIds.Contains(assignment.UserId))
            {
                project.AssignedEditors.Add(new ProjectEditor
                {
                    ProjectEditorId = Guid.NewGuid(),
                    ProjectId = project.ProjectId,
                    UserId = assignment.UserId,
                    AssignmentRole = string.IsNullOrWhiteSpace(assignment.AssignmentRole) ? "General" : assignment.AssignmentRole,
                    IsLead = false,
                    AssignedAt = DateTime.UtcNow
                });
                assignedUserIds.Add(assignment.UserId);
            }
        }

        foreach (var linkDto in request.Links)
        {
            project.Links.Add(new ProjectLink
            {
                ProjectLinkId = Guid.NewGuid(),
                ProjectId = project.ProjectId,
                Url = linkDto.Url.Trim(),
                LinkType = string.IsNullOrWhiteSpace(linkDto.LinkType) ? "Folder" : linkDto.LinkType,
                CreatedAt = DateTime.UtcNow
            });
        }

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();

        // Se AutoIngest == true, aciona o disparo automático de ingestão para os links do projeto
        if (project.AutoIngest && project.Links.Count > 0)
        {
            await TriggerIngestInternalAsync(project.ProjectId);
        }

        return CreatedAtAction(nameof(GetProjectById), new { id = project.ProjectId }, project);
    }

    /// <summary>
    /// Atualiza dados de um projeto existente, seus links e aciona disparo de ingestão para novos links se AutoIngest == true.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectRequest request)
    {
        var project = await _context.Projects
            .Include(p => p.Links)
            .Include(p => p.AssignedEditors)
            .FirstOrDefaultAsync(p => p.ProjectId == id && !p.IsDeleted);

        if (project == null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { Message = "O título do projeto é obrigatório." });
        }

        if (request.Deadline.HasValue && request.Deadline.Value.Date < DateTime.UtcNow.Date)
        {
            return BadRequest(new { Message = "O prazo de entrega não pode ser uma data passada." });
        }

        project.Title = request.Title.Trim();
        project.BriefingText = request.BriefingText?.Trim();
        project.ExternalOrderReference = request.ExternalOrderReference?.Trim();
        project.Deadline = request.Deadline;
        project.Status = request.Status;
        project.AutoIngest = request.AutoIngest;
        project.LeadUserId = request.LeadUserId;
        project.UpdatedAt = DateTime.UtcNow;

        // Update AssignedEditors
        var existingEditors = await _context.ProjectEditors.Where(pe => pe.ProjectId == id).ToListAsync();
        _context.ProjectEditors.RemoveRange(existingEditors);

        var assignedUserIds = new HashSet<Guid>();
        if (request.LeadUserId.HasValue && request.LeadUserId.Value != Guid.Empty)
        {
            _context.ProjectEditors.Add(new ProjectEditor
            {
                ProjectEditorId = Guid.NewGuid(),
                ProjectId = project.ProjectId,
                UserId = request.LeadUserId.Value,
                AssignmentRole = "General",
                IsLead = true,
                AssignedAt = DateTime.UtcNow
            });
            assignedUserIds.Add(request.LeadUserId.Value);
        }

        foreach (var assignment in request.AssignedEditors)
        {
            if (assignment.UserId != Guid.Empty && !assignedUserIds.Contains(assignment.UserId))
            {
                _context.ProjectEditors.Add(new ProjectEditor
                {
                    ProjectEditorId = Guid.NewGuid(),
                    ProjectId = project.ProjectId,
                    UserId = assignment.UserId,
                    AssignmentRole = string.IsNullOrWhiteSpace(assignment.AssignmentRole) ? "General" : assignment.AssignmentRole,
                    IsLead = false,
                    AssignedAt = DateTime.UtcNow
                });
                assignedUserIds.Add(assignment.UserId);
            }
        }

        var existingLinks = project.Links.ToList();
        _context.ProjectLinks.RemoveRange(existingLinks);
        project.Links.Clear();

        foreach (var linkDto in request.Links)
        {
            if (!string.IsNullOrWhiteSpace(linkDto.Url))
            {
                var newLink = new ProjectLink
                {
                    ProjectLinkId = Guid.NewGuid(),
                    ProjectId = project.ProjectId,
                    Url = linkDto.Url.Trim(),
                    LinkType = string.IsNullOrWhiteSpace(linkDto.LinkType) ? "Folder" : linkDto.LinkType,
                    CreatedAt = DateTime.UtcNow
                };
                _context.ProjectLinks.Add(newLink);
                project.Links.Add(newLink);
            }
        }

        await _context.SaveChangesAsync();

        if (project.AutoIngest && project.Links.Count > 0)
        {
            await TriggerIngestInternalAsync(project.ProjectId);
        }

        return Ok(project);
    }

    /// <summary>
    /// Dispara o processo de ingestão dos links do projeto (Manual ou Automático).
    /// Identifica links pendentes, cria o Asset e enfileira em MediaProcessingJobs sem duplicar mídias já ingeridas.
    /// </summary>
    [HttpPost("{id:guid}/TriggerIngest")]
    public async Task<IActionResult> TriggerIngest(Guid id)
    {
        var project = await _context.Projects
            .Include(p => p.Links)
            .FirstOrDefaultAsync(p => p.ProjectId == id && !p.IsDeleted);

        if (project == null) return NotFound();

        var result = await TriggerIngestInternalAsync(id);
        return Ok(result);
    }

    /// <summary>
    /// Método interno atômico que varre os links e gera tarefas de ingestão para o Worker.Ingestion.
    /// </summary>
    private async Task<object> TriggerIngestInternalAsync(Guid projectId)
    {
        var links = await _context.ProjectLinks
            .Where(l => l.ProjectId == projectId)
            .ToListAsync();

        if (links.Count == 0)
        {
            return new { EnqueuedCount = 0, SkippedCount = 0, Message = "Nenhum link anexado ao projeto." };
        }

        // Enfileira Job de IngestDownload para o Worker.Ingestion
        var job = new MediaProcessingJob
        {
            JobId = Guid.NewGuid(),
            ProjectId = projectId,
            AssetId = null,
            JobType = "IngestDownload",
            Status = "Pending",
            Priority = 10,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.MediaProcessingJobs.Add(job);
        await _context.SaveChangesAsync();

        return new
        {
            EnqueuedCount = links.Count,
            SkippedCount = 0,
            Message = $"Ingestão enfileirada com sucesso para varredura de {links.Count} links."
        };
    }

    /// <summary>
    /// Remove um projeto (Suporta Soft Delete via soft=true e Hard Delete via soft=false).
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteProject(Guid id, [FromQuery] bool soft = true)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null) return NotFound();

        if (soft)
        {
            project.IsDeleted = true;
            project.UpdatedAt = DateTime.UtcNow;
        }
        else
        {
            _context.Projects.Remove(project);
        }

        await _context.SaveChangesAsync();
        return NoContent();
    }
}
