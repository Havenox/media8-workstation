using System.IO;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;

namespace Media8.Workstation.Api.Controllers;

/// <summary>
/// Controlador blindado para fornecimento de arquivos físicos de mídia (avatares, vídeos brutos, proxies e waveforms).
/// Requer obrigatoriamente autenticação prévia (JWT via Header Authorization ou Cookie HttpOnly "media8_auth").
/// </summary>
[Authorize]
public class StorageController : WorkstationBaseController
{
    private readonly string _storagePath;

    public StorageController(IConfiguration configuration)
    {
        var configuredPath = configuration["STORAGE_PATH"];
        if (string.IsNullOrWhiteSpace(configuredPath))
        {
            configuredPath = Directory.Exists("/storage")
                ? "/storage"
                : Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "..", "media8-storage"));

            if (!Directory.Exists(configuredPath))
            {
                configuredPath = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "media8-storage"));
            }
        }

        _storagePath = configuredPath;
    }

    /// <summary>
    /// Serve o arquivo de mídia de forma protegida com suporte nativo a Range Requests (HTTP 206 Partial Content).
    /// </summary>
    /// <param name="filePath">Caminho relativo do arquivo dentro da pasta media8-storage (ex: avatars/foto.webp, high-fidelity/v1.mp4).</param>
    /// <returns>PhysicalFileResult com enableRangeProcessing = true para permitir streaming de vídeos e timecode.</returns>
    [HttpGet("{*filePath}")]
    public IActionResult GetProtectedMediaFile(string filePath)
    {
        if (string.IsNullOrWhiteSpace(filePath))
        {
            return BadRequest(new { Message = "Caminho do arquivo não informado." });
        }

        // Prevenção de Path Traversal Attack (evita ../../etc/passwd)
        var sanitizedRelativePath = filePath.TrimStart('/', '\\').Replace("..", string.Empty);
        var fullPath = Path.GetFullPath(Path.Combine(_storagePath, sanitizedRelativePath));

        if (!fullPath.StartsWith(Path.GetFullPath(_storagePath), System.StringComparison.OrdinalIgnoreCase))
        {
            return Forbid();
        }

        if (!System.IO.File.Exists(fullPath))
        {
            return NotFound(new { Message = "Arquivo de mídia não encontrado." });
        }

        var contentType = GetContentType(fullPath);

        // enableRangeProcessing: true habilita HTTP 206 Partial Content nativo para player HTML5
        return PhysicalFile(fullPath, contentType, enableRangeProcessing: true);
    }

    private static string GetContentType(string filePath)
    {
        var extension = Path.GetExtension(filePath).ToLowerInvariant();
        return extension switch
        {
            ".webp" => "image/webp",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".svg" => "image/svg+xml",
            ".mp4" => "video/mp4",
            ".webm" => "video/webm",
            ".mov" => "video/quicktime",
            ".mkv" => "video/x-matroska",
            ".mp3" => "audio/mpeg",
            ".wav" => "audio/wav",
            ".json" => "application/json",
            ".pdf" => "application/pdf",
            _ => "application/octet-stream"
        };
    }
}
