using System.Diagnostics;
using System.Text;
using System.Text.RegularExpressions;
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
                logger.LogInformation("[DocumentTextExtractorService] Iniciando extração de texto de PDF: {FileName}...", fileName);
                bool extractedAnyText = false;

                // Estratégia 1: pdftotext (Poppler CLI - Ultra rápido e preserva layout original)
                var tempTxtPath = Path.Combine(Path.GetTempPath(), $"{Guid.NewGuid()}_extracted.txt");
                try
                {
                    using var process = new Process();
                    process.StartInfo.FileName = "pdftotext";
                    process.StartInfo.Arguments = $"-layout \"{rawFilePath}\" \"{tempTxtPath}\"";
                    process.StartInfo.UseShellExecute = false;
                    process.StartInfo.CreateNoWindow = true;

                    process.Start();
                    await process.WaitForExitAsync(cancellationToken);

                    if (File.Exists(tempTxtPath))
                    {
                        var pdftotextResult = await File.ReadAllTextAsync(tempTxtPath, cancellationToken);
                        if (!string.IsNullOrWhiteSpace(pdftotextResult) && pdftotextResult.Trim().Length > 10)
                        {
                            extractedAnyText = true;
                            sb.AppendLine(pdftotextResult.Trim());
                            logger.LogInformation("[DocumentTextExtractorService] ✓ Texto extraído com sucesso via pdftotext nativo ({Length} chars).", pdftotextResult.Length);
                        }
                        try { File.Delete(tempTxtPath); } catch { }
                    }
                }
                catch (Exception pdftotextEx)
                {
                    logger.LogWarning(pdftotextEx, "[DocumentTextExtractorService] pdftotext não disponível no sistema local. Alternando para biblioteca C# PdfPig.");
                }

                // Estratégia 2: PdfPig C# (Leitura via AST de Palavras/GetWords)
                if (!extractedAnyText)
                {
                    try
                    {
                        using var document = PdfDocument.Open(rawFilePath);
                        foreach (var page in document.GetPages())
                        {
                            var words = page.GetWords();
                            var pageText = words.Any()
                                ? string.Join(" ", words.Select(w => w.Text))
                                : page.Text;

                            if (!string.IsNullOrWhiteSpace(pageText))
                            {
                                extractedAnyText = true;
                                sb.AppendLine($"## Página {page.Number}");
                                sb.AppendLine();
                                sb.AppendLine(pageText.Trim());
                                sb.AppendLine();
                            }
                        }
                        if (extractedAnyText)
                        {
                            logger.LogInformation("[DocumentTextExtractorService] ✓ Texto extraído com sucesso via C# PdfPig.");
                        }
                    }
                    catch (Exception pdfPigEx)
                    {
                        logger.LogWarning(pdfPigEx, "[DocumentTextExtractorService] PdfPig falhou ao extrair texto do PDF {FileName}.", fileName);
                    }
                }

                // Estratégia 3: Parser de Tokens UTF-8 de Segurança
                if (!extractedAnyText)
                {
                    sb.AppendLine("*(Conteúdo extraído via leitura de stream de segurança do documento PDF)*");
                    sb.AppendLine();
                    var rawBytes = await File.ReadAllBytesAsync(rawFilePath, cancellationToken);
                    var rawContent = Encoding.UTF8.GetString(rawBytes);

                    var matches = Regex.Matches(rawContent, @"\(([^\)]{3,})\)");
                    int extractedCount = 0;
                    foreach (Match match in matches)
                    {
                        var val = match.Groups[1].Value.Trim();
                        if (val.Length > 3 && !val.StartsWith("/") && !val.StartsWith("%"))
                        {
                            sb.AppendLine(val);
                            extractedCount++;
                            if (extractedCount > 200) break;
                        }
                    }

                    if (extractedCount == 0)
                    {
                        sb.AppendLine($"*(O documento PDF '{fileName}' foi ingerido com sucesso. Conteúdo textual não-estruturado mantido no ativo original)*");
                    }
                }
            }
            else if (ext is ".txt" or ".md" or ".json" or ".csv" or ".xml")
            {
                var rawText = await File.ReadAllTextAsync(rawFilePath, cancellationToken);
                sb.AppendLine(rawText);
            }
            else
            {
                sb.AppendLine($"*(Conteúdo extraído do arquivo {fileName})*");
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
