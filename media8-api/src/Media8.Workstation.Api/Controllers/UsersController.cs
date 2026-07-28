using Media8.Workstation.Application.DTOs;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace Media8.Workstation.Api.Controllers;

/// <summary>
/// Controlador responsável pelo gerenciamento de Usuários, Funções e Avatares de Perfil.
/// </summary>
[Authorize]
public class UsersController(WorkstationDbContext context, IWebHostEnvironment environment, IConfiguration configuration) : WorkstationBaseController
{
    private static readonly PasswordHasher<User> _passwordHasher = new();

    /// <summary>
    /// Obtém estatísticas consolidadas numéricas dos usuários cadastrados no sistema.
    /// </summary>
    [HttpGet("Stats")]
    public async Task<ActionResult<UserStatsDto>> GetUserStats()
    {
        var totalUsers = await context.Users.CountAsync();
        var adminCount = await context.Users.CountAsync(u => u.Role == "Admin");
        var editorCount = await context.Users.CountAsync(u => u.Role == "Editor");

        return Ok(new UserStatsDto
        {
            TotalUsers = totalUsers,
            AdminCount = adminCount,
            EditorCount = editorCount
        });
    }

    /// <summary>
    /// Lista os usuários com suporte a paginação (20 em 20), busca e filtros por função.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResultDto<UserDto>>> GetUsers(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? search = null,
        [FromQuery] string? role = null)
    {
        var query = context.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(role) && role.ToUpper() != "ALL")
        {
            query = query.Where(u => u.Role == role);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var cleanSearch = search.Trim().ToLower();
            query = query.Where(u =>
                u.Name.ToLower().Contains(cleanSearch) ||
                u.Email.ToLower().Contains(cleanSearch));
        }

        var totalCount = await query.CountAsync();

        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new UserDto
            {
                UserId = u.UserId,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role,
                AvatarUrl = u.AvatarUrl,
                AssignedProjectsCount = context.ProjectEditors.Count(pe => pe.UserId == u.UserId && !pe.Project.IsDeleted),
                CreatedAt = u.CreatedAt
            })
            .ToListAsync();

        return Ok(new PagedResultDto<UserDto>
        {
            Items = users,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        });
    }

    /// <summary>
    /// Cadastra um novo usuário no sistema (Exclusivo para Administradores).
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> CreateUser([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { Message = "Nome, e-mail e senha são obrigatórios." });
        }

        var exists = await context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.Trim().ToLower());
        if (exists)
        {
            return BadRequest(new { Message = "E-mail já cadastrado no sistema." });
        }

        var user = new User
        {
            Name = request.Name.Trim(),
            Email = request.Email.Trim().ToLower(),
            Role = string.IsNullOrWhiteSpace(request.Role) ? "Editor" : request.Role,
            AvatarUrl = request.AvatarUrl,
            CreatedAt = DateTime.UtcNow
        };

        user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);

        context.Users.Add(user);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetUsers), new { id = user.UserId }, new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt
        });
    }

    /// <summary>
    /// Atualiza as informações de cadastro e função de um usuário (Exclusivo para Administradores).
    /// </summary>
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<UserDto>> UpdateUser(Guid id, [FromBody] UpdateUserRequest request)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.UserId == id);
        if (user == null) return NotFound(new { Message = "Usuário não encontrado." });

        if (string.IsNullOrWhiteSpace(request.Name) || string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { Message = "Nome e e-mail são obrigatórios." });
        }

        var emailClean = request.Email.Trim().ToLower();
        var emailTaken = await context.Users.AnyAsync(u => u.UserId != id && u.Email.ToLower() == emailClean);
        if (emailTaken)
        {
            return BadRequest(new { Message = "O e-mail informado já está em uso por outro usuário." });
        }

        user.Name = request.Name.Trim();
        user.Email = emailClean;
        user.Role = string.IsNullOrWhiteSpace(request.Role) ? "Editor" : request.Role;
        if (request.AvatarUrl != null)
        {
            user.AvatarUrl = request.AvatarUrl;

            // Purge local .webp avatar file if switching to an external URL (http/https)
            if (request.AvatarUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) ||
                request.AvatarUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            {
                var storagePath = configuration["STORAGE_PATH"];
                if (string.IsNullOrWhiteSpace(storagePath))
                {
                    storagePath = Directory.Exists("/storage") 
                        ? "/storage" 
                        : Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "media8-storage"));

                    if (!Directory.Exists(storagePath))
                    {
                        storagePath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "media8-storage"));
                    }
                }

                var localAvatarFile = Path.Combine(storagePath, "avatars", $"{user.UserId}.webp");
                if (System.IO.File.Exists(localAvatarFile))
                {
                    try { System.IO.File.Delete(localAvatarFile); } catch { /* ignore */ }
                }
            }
        }

        if (!string.IsNullOrWhiteSpace(request.Password))
        {
            user.PasswordHash = _passwordHasher.HashPassword(user, request.Password);
        }

        await context.SaveChangesAsync();

        return Ok(new UserDto
        {
            UserId = user.UserId,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role,
            AvatarUrl = user.AvatarUrl,
            CreatedAt = user.CreatedAt
        });
    }

    /// <summary>
    /// Efetua o upload, validação de segurança (Magic Bytes), crop 200x200px e conversão para WebP (80% qualidade) da foto de perfil.
    /// </summary>
    [HttpPost("{id:guid}/avatar")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<object>> UploadAvatar(Guid id, IFormFile file)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.UserId == id);
        if (user == null) return NotFound(new { Message = "Usuário não encontrado." });

        if (file == null || file.Length == 0)
        {
            return BadRequest(new { Message = "Nenhum arquivo de imagem foi enviado." });
        }

        // 1. Resolve Storage Directory (Docker volume /storage or local media8-storage)
        var storagePath = configuration["STORAGE_PATH"];
        if (string.IsNullOrWhiteSpace(storagePath))
        {
            storagePath = Directory.Exists("/storage") 
                ? "/storage" 
                : Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "media8-storage"));

            if (!Directory.Exists(storagePath))
            {
                storagePath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "media8-storage"));
            }
        }

        var avatarsDir = Path.Combine(storagePath, "avatars");
        if (!Directory.Exists(avatarsDir))
        {
            Directory.CreateDirectory(avatarsDir);
        }

        // 2. Process Image using ImageSharp: Validate Magic Bytes, Crop/Resize to 200x200px & Save WebP @ 80% Quality
        var fileName = $"{user.UserId}.webp";
        var filePath = Path.Combine(avatarsDir, fileName);

        try
        {
            using var stream = file.OpenReadStream();
            using var image = await Image.LoadAsync(stream);

            image.Mutate(x => x.Resize(new ResizeOptions
            {
                Size = new Size(200, 200),
                Mode = ResizeMode.Crop
            }));

            var encoder = new WebpEncoder
            {
                Quality = 80
            };

            await image.SaveAsync(filePath, encoder);
        }
        catch
        {
            return BadRequest(new { Message = "O arquivo enviado é inválido ou não é um formato de imagem reconhecido." });
        }

        // 4. Update Database AvatarUrl with cache-busting timestamp
        var relativeUrl = $"/storage/avatars/{fileName}?v={DateTime.UtcNow.Ticks}";
        user.AvatarUrl = relativeUrl;
        await context.SaveChangesAsync();

        return Ok(new { AvatarUrl = relativeUrl, Message = "Foto de perfil processada e salva com sucesso!" });
    }
}
