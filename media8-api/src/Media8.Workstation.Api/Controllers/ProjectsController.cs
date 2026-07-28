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
/// DTO de requisição para criação de novo projeto.
/// </summary>
public class CreateProjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string? BriefingText { get; set; }
    public string? ExternalOrderReference { get; set; } // Chave fria / Alias do CRM (ex: #0254)
    public DateTime? Deadline { get; set; } // Prazo de entrega
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
    public DateTime? Deadline { get; set; }
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
        // 1. Obter permissões do usuário autenticado a partir dos Claims do JWT
        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var roleClaim = User.FindFirstValue(ClaimTypes.Role);

        Guid.TryParse(userIdClaim, out var currentUserId);

        var query = _context.Projects
            .Include(p => p.Links)
            .Include(p => p.Assets)
            .Where(p => !p.IsDeleted)
            .AsNoTracking();

        // 2. Aplicar trava RBAC: se não for Admin, restringe aos projetos atribuídos ao editor
        if (roleClaim != "Admin")
        {
            query = query.Where(p => p.AssignedEditors.Any(e => e.UserId == currentUserId));
        }

        // 3. Aplicar filtros de busca e status
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

        // 4. Se um limite fixo for solicitado (ex: limit=5 na Dashboard)
        if (limit.HasValue && limit.Value > 0)
        {
            var recentProjects = await query.Take(limit.Value).ToListAsync();
            return Ok(recentProjects);
        }

        // 5. Caso contrário, retorna payload paginado oficial (PagedResultDto)
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
    /// Validado contra permissões de acesso do usuário.
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

        // Trava RBAC
        if (roleClaim != "Admin" && !project.AssignedEditors.Any(e => e.UserId == currentUserId))
        {
            return Forbid();
        }

        return Ok(project);
    }

    /// <summary>
    /// Cadastra um novo projeto manualmente com seus links categorizados e prazo de entrega.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Project>> CreateProject([FromBody] CreateProjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            return BadRequest(new { Message = "O título do projeto é obrigatório." });
        }

        // Validação defensiva de data de entrega
        if (request.Deadline.HasValue && request.Deadline.Value.Date < DateTime.UtcNow.Date)
        {
            return BadRequest(new { Message = "O prazo de entrega não pode ser uma data passada." });
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
            Deadline = request.Deadline,
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

        // Validação defensiva de data de entrega
        if (request.Deadline.HasValue && request.Deadline.Value.Date < DateTime.UtcNow.Date)
        {
            return BadRequest(new { Message = "O prazo de entrega não pode ser uma data passada." });
        }

        project.Title = request.Title.Trim();
        project.BriefingText = request.BriefingText?.Trim();
        project.ExternalOrderReference = request.ExternalOrderReference?.Trim();
        project.Deadline = request.Deadline;
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
