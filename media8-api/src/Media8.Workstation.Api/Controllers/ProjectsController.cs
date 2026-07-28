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
/// DTO de requisição para criação de novo projeto.
/// </summary>
public class CreateProjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string? BriefingText { get; set; }
    public string? ExternalOrderReference { get; set; } // Chave fria / Alias do CRM (ex: #0254)
    public Guid CreatedByUserId { get; set; }
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
    public string Status { get; set; } = "InProduction";
    public List<ProjectLinkDto> Links { get; set; } = new();
}

/// <summary>
/// Controlador oficial da API v1 para gerenciamento de Projetos e Links na Workstation.
/// Herda de WorkstationBaseController (Rota: api/v1/Projects).
/// </summary>
[Authorize]
public class ProjectsController(WorkstationDbContext context) : WorkstationBaseController
{
    private readonly WorkstationDbContext _context = context;

    /// <summary>
    /// Lista todos os projetos ativos do sistema (não-deletados).
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Project>>> GetProjects([FromQuery] Guid? userId, [FromQuery] string? role)
    {
        var query = _context.Projects
            .Include(p => p.Links)
            .Include(p => p.Assets)
            .Where(p => !p.IsDeleted)
            .AsNoTracking();

        if (role != "Admin" && userId.HasValue)
        {
            query = query.Where(p => p.AssignedEditors.Any(e => e.UserId == userId.Value));
        }

        var projects = await query.OrderByDescending(p => p.CreatedAt).ToListAsync();
        return Ok(projects);
    }

    /// <summary>
    /// Retorna detalhes de um projeto por ID com seus links e mídias.
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<Project>> GetProjectById(Guid id)
    {
        var project = await _context.Projects
            .Include(p => p.Links)
            .Include(p => p.Assets)
            .Include(p => p.AssignedEditors)
                .ThenInclude(e => e.User)
            .FirstOrDefaultAsync(p => p.ProjectId == id && !p.IsDeleted);

        if (project == null) return NotFound();

        return Ok(project);
    }

    /// <summary>
    /// Cadastra um novo projeto manualmente com seus links categorizados.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject([FromBody] CreateProjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { Message = "O título do projeto é obrigatório." });
        }

        // Validação defensiva de URLs nos links informados
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
            CreatedByUserId = request.CreatedByUserId,
            Status = "InProduction",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

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

        return CreatedAtAction(nameof(GetProjectById), new { id = project.ProjectId }, project);
    }

    /// <summary>
    /// Atualiza dados de um projeto existente e seus links.
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<IActionResult> UpdateProject(Guid id, [FromBody] UpdateProjectRequest request)
    {
        var project = await _context.Projects
            .Include(p => p.Links)
            .FirstOrDefaultAsync(p => p.ProjectId == id && !p.IsDeleted);

        if (project == null) return NotFound();

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { Message = "O título do projeto é obrigatório." });
        }

        project.Title = request.Title.Trim();
        project.BriefingText = request.BriefingText?.Trim();
        project.ExternalOrderReference = request.ExternalOrderReference?.Trim();
        project.Status = request.Status;
        project.UpdatedAt = DateTime.UtcNow;

        // Atualizar links
        _context.ProjectLinks.RemoveRange(project.Links);
        foreach (var linkDto in request.Links)
        {
            if (!string.IsNullOrWhiteSpace(linkDto.Url))
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
        }

        await _context.SaveChangesAsync();
        return Ok(project);
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
