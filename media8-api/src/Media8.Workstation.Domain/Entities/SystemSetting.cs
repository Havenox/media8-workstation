using System;

namespace Media8.Workstation.Domain.Entities;

/// <summary>
/// Entidade de configuração global do sistema (ex: chaves de API, rotas de armazenamento, integração com storage).
/// </summary>
public class SystemSetting
{
    public Guid SettingId { get; set; } = Guid.NewGuid();
    public string Key { get; set; } = string.Empty;
    public string Value { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public Guid? UpdatedByUserId { get; set; }
}
