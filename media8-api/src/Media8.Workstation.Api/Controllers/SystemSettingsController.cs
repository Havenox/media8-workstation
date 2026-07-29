using System;
using System.Net.Http;
using System.Security.Claims;
using System.Threading.Tasks;
using Media8.Workstation.Domain.Entities;
using Media8.Workstation.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Media8.Workstation.Api.Controllers;

public class GoogleDriveSettingsDto
{
    public string ApiKey { get; set; } = string.Empty; // Masked for security
    public bool IsConfigured { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class SaveGoogleDriveSettingsRequest
{
    public string ApiKey { get; set; } = string.Empty;
}

public class TestGoogleDriveConnectionResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

/// <summary>
/// Controlador administrativo para gerenciamento de chaves de API e integrações globais do sistema.
/// Restrito estritamente a usuários com perfil Admin.
/// </summary>
[Authorize(Roles = "Admin")]
public class SystemSettingsController(WorkstationDbContext context) : WorkstationBaseController
{
    private readonly WorkstationDbContext _context = context;
    private const string GoogleDriveApiKeySettingKey = "GoogleDrive:ApiKey";

    /// <summary>
    /// Obtém as configurações ativas da integração com o Google Drive.
    /// A chave de API é retornada mascarada por questões de segurança.
    /// </summary>
    [HttpGet("GoogleDrive")]
    public async Task<ActionResult<GoogleDriveSettingsDto>> GetGoogleDriveSettings()
    {
        var setting = await _context.SystemSettings
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == GoogleDriveApiKeySettingKey);

        if (setting == null || string.IsNullOrWhiteSpace(setting.Value))
        {
            return Ok(new GoogleDriveSettingsDto
            {
                ApiKey = string.Empty,
                IsConfigured = false,
                UpdatedAt = null
            });
        }

        return Ok(new GoogleDriveSettingsDto
        {
            ApiKey = MaskApiKey(setting.Value),
            IsConfigured = true,
            UpdatedAt = setting.UpdatedAt
        });
    }

    /// <summary>
    /// Salva ou atualiza a Chave de API do Google Drive no banco de dados.
    /// </summary>
    [HttpPost("GoogleDrive")]
    public async Task<ActionResult<GoogleDriveSettingsDto>> SaveGoogleDriveSettings([FromBody] SaveGoogleDriveSettingsRequest request)
    {
        if (request == null || string.IsNullOrWhiteSpace(request.ApiKey))
        {
            return BadRequest(new { Message = "A chave de API do Google Drive é obrigatória." });
        }

        var cleanKey = request.ApiKey.Trim();

        var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        Guid.TryParse(userIdClaim, out var currentUserId);

        var setting = await _context.SystemSettings
            .FirstOrDefaultAsync(s => s.Key == GoogleDriveApiKeySettingKey);

        if (setting == null)
        {
            setting = new SystemSetting
            {
                SettingId = Guid.NewGuid(),
                Key = GoogleDriveApiKeySettingKey,
                Value = cleanKey,
                Description = "Chave de API oficial do Google Drive para varredura e ingestão de mídias.",
                UpdatedAt = DateTime.UtcNow,
                UpdatedByUserId = currentUserId
            };
            _context.SystemSettings.Add(setting);
        }
        else
        {
            setting.Value = cleanKey;
            setting.UpdatedAt = DateTime.UtcNow;
            setting.UpdatedByUserId = currentUserId;
        }

        await _context.SaveChangesAsync();

        return Ok(new GoogleDriveSettingsDto
        {
            ApiKey = MaskApiKey(setting.Value),
            IsConfigured = true,
            UpdatedAt = setting.UpdatedAt
        });
    }

    /// <summary>
    /// Testador de Conexão: Realiza uma requisição HTTP contra a API do Google Drive para validar a chave fornecida.
    /// </summary>
    [HttpPost("GoogleDrive/Test")]
    public async Task<ActionResult<TestGoogleDriveConnectionResponse>> TestGoogleDriveConnection([FromBody] SaveGoogleDriveSettingsRequest? request)
    {
        string apiKeyToTest = request?.ApiKey?.Trim() ?? string.Empty;

        // Se a chave recebida for um valor mascarado ou vazia, busca a chave real salva no banco
        if (string.IsNullOrWhiteSpace(apiKeyToTest) || apiKeyToTest.Contains("****"))
        {
            var setting = await _context.SystemSettings
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Key == GoogleDriveApiKeySettingKey);

            if (setting == null || string.IsNullOrWhiteSpace(setting.Value))
            {
                return BadRequest(new TestGoogleDriveConnectionResponse
                {
                    Success = false,
                    Message = "Nenhuma Chave de API do Google Drive salva ou fornecida para o teste."
                });
            }

            apiKeyToTest = setting.Value;
        }

        try
        {
            using var httpClient = new HttpClient();
            httpClient.Timeout = TimeSpan.FromSeconds(10);

            // Chamada de validação contra a API pública REST da Google Drive API v3
            var googleDiscoveryUrl = $"https://www.googleapis.com/discovery/v1/apis/drive/v3/rest?key={Uri.EscapeDataString(apiKeyToTest)}";
            var response = await httpClient.GetAsync(googleDiscoveryUrl);

            if (response.IsSuccessStatusCode)
            {
                return Ok(new TestGoogleDriveConnectionResponse
                {
                    Success = true,
                    Message = "Conexão com a API do Google Drive estabelecida com sucesso! A chave é válida."
                });
            }
            else
            {
                var errorContent = await response.Content.ReadAsStringAsync();
                return BadRequest(new TestGoogleDriveConnectionResponse
                {
                    Success = false,
                    Message = $"Falha ao validar a chave no Google. Resposta HTTP {(int)response.StatusCode}: {response.ReasonPhrase}"
                });
            }
        }
        catch (Exception ex)
        {
            return StatusCode(500, new TestGoogleDriveConnectionResponse
            {
                Success = false,
                Message = $"Erro ao conectar à API do Google Drive: {ex.Message}"
            });
        }
    }

    private static string MaskApiKey(string key)
    {
        if (string.IsNullOrWhiteSpace(key)) return string.Empty;
        if (key.Length <= 8) return "****";

        var start = key[..4];
        var end = key[^4..];
        return $"{start}****************{end}";
    }
}
