using System.Text;
using Microsoft.Extensions.Logging;
using UglyToad.PdfPig;

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

            if (ext == ".pdf")
            {
                logger.LogInformation("[DocumentTextExtractorService] Extraindo texto de PDF via PdfPig: {FileName}...", fileName);
                using var document = PdfDocument.Open(rawFilePath);

                foreach (var page in document.GetPages())
                {
                    var pageText = page.Text;
                    if (!string.IsNullOrWhiteSpace(pageText))
                    {
                        sb.AppendLine($"## Página {page.Number}");
                        sb.AppendLine();
                        sb.AppendLine(pageText.Trim());
                        sb.AppendLine();
                    }
                }
            }
            else if (ext == ".txt" || ext == ".md" || ext == ".json" || ext == ".csv" || ext == ".xml")
            {
                var rawText = await File.ReadAllTextAsync(rawFilePath, cancellationToken);
                sb.AppendLine(rawText);
            }
            else
            {
                sb.AppendLine($"*(Extração genérica do arquivo {fileName})*");
                sb.AppendLine();
                var lines = await File.ReadAllLinesAsync(rawFilePath, cancellationToken);
                foreach (var line in lines.Take(500))
                {
                    if (!string.IsNullOrWhiteSpace(line))
                    {
                        sb.AppendLine(line);
                    }
                }
            }

            await File.WriteAllTextAsync(targetMarkdownPath, sb.ToString(), cancellationToken);
            logger.LogInformation("[DocumentTextExtractorService] ✓ Documento extraído com sucesso para Markdown -> {Path}", targetMarkdownPath);
            return targetMarkdownPath;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "[DocumentTextExtractorService] Falha ao extrair texto do documento {RawFilePath}", rawFilePath);
            return null;
        }
    }
}
