using System.Text;
using Microsoft.Extensions.Logging;

namespace Media8.Workstation.Worker.Transcoder.Services;

public class DocumentTextExtractorService(ILogger<DocumentTextExtractorService> logger)
{
    public async Task<string?> ExtractDocumentToMarkdownAsync(
        string rawFilePath,
        string targetMarkdownPath,
        CancellationToken cancellationToken = default)
    {
        if (!File.Exists(rawFilePath))
        {
            logger.LogWarning("[DocumentTextExtractorService] Arquivo de documento não encontrado: {RawFilePath}", rawFilePath);
            return null;
        }

        var ext = Path.GetExtension(rawFilePath).ToLowerInvariant();
        var fileName = Path.GetFileName(rawFilePath);

        try
        {
            var targetDir = Path.GetDirectoryName(targetMarkdownPath);
            if (!string.IsNullOrEmpty(targetDir) && !Directory.Exists(targetDir))
            {
                Directory.CreateDirectory(targetDir);
            }

            var sb = new StringBuilder();
            sb.AppendLine($"# Documento Extraído: {fileName}");
            sb.AppendLine($"*Data de Processamento: {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss} UTC*");
            sb.AppendLine();
            sb.AppendLine("---");
            sb.AppendLine();

            if (ext == ".txt" || ext == ".md" || ext == ".json" || ext == ".csv" || ext == ".xml")
            {
                var rawText = await File.ReadAllTextAsync(rawFilePath, cancellationToken);
                sb.AppendLine(rawText);
            }
            else
            {
                // Fallback / Extração genérica para outros tipos de documentos
                sb.AppendLine($"*(Conteúdo extraído do arquivo {fileName})*");
                sb.AppendLine();
                sb.AppendLine("```text");
                var lines = await File.ReadAllLinesAsync(rawFilePath, cancellationToken);
                foreach (var line in lines.Take(1000))
                {
                    sb.AppendLine(line);
                }
                sb.AppendLine("```");
            }

            await File.WriteAllTextAsync(targetMarkdownPath, sb.ToString(), cancellationToken);
            logger.LogInformation("[DocumentTextExtractorService] ✓ Documento extraído para Markdown -> {Path}", targetMarkdownPath);
            return targetMarkdownPath;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[DocumentTextExtractorService] Falha ao extrair texto do documento {RawFilePath}", rawFilePath);
            return null;
        }
    }
}
