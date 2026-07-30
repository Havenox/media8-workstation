using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Media8.Workstation.Domain.Entities;

namespace Media8.Workstation.Worker.Ingestion.Providers;

public class GoogleDriveIngestionProvider : IIngestionProvider
{
    private static readonly HashSet<string> BlockedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        // Executáveis e instaladores binários
        ".exe", ".msi", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".com", ".scr", ".pif", ".gadget", ".cpl",

        // Scripts e código de máquina
        ".js", ".jsx", ".ts", ".tsx", ".py", ".php", ".rb", ".pl", ".jar", ".class", ".dll", ".sys", ".so", ".dylib", ".wasm",

        // Imagens de disco / instaladores com código executável
        ".iso", ".img", ".dmg"
    };

    public bool CanHandle(string url, string linkType)
    {
        if (string.IsNullOrWhiteSpace(url)) return false;
        return linkType?.Equals("GoogleDrive", StringComparison.OrdinalIgnoreCase) == true ||
               url.Contains("drive.google.com", StringComparison.OrdinalIgnoreCase);
    }

    public async Task<IngestionProviderResult> DiscoverAndDownloadFilesAsync(
        ProjectLink link,
        string apiKey,
        string targetDirectory,
        Func<DiscoveredMediaFile, string, Task> onFileDownloadedAsync,
        CancellationToken cancellationToken)
    {
        var result = new IngestionProviderResult();

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            result.Success = false;
            result.ErrorMessage = "Chave de API do Google Drive não configurada no Painel do Administrador.";
            return result;
        }

        Directory.CreateDirectory(targetDirectory);

        using var httpClient = new HttpClient();
        httpClient.Timeout = TimeSpan.FromHours(2); // Suporte a downloads de vídeos grandes

        try
        {
            var folderIdMatch = Regex.Match(link.Url, @"/folders/([a-zA-Z0-9_-]+)");
            var fileIdMatch = Regex.Match(link.Url, @"/file/d/([a-zA-Z0-9_-]+)") ;
            var queryIdMatch = Regex.Match(link.Url, @"id=([a-zA-Z0-9_-]+)");

            if (folderIdMatch.Success)
            {
                var folderId = folderIdMatch.Groups[1].Value;
                await ProcessFolderAsync(httpClient, apiKey, folderId, targetDirectory, onFileDownloadedAsync, result, cancellationToken);
            }
            else if (fileIdMatch.Success || queryIdMatch.Success)
            {
                var fileId = fileIdMatch.Success ? fileIdMatch.Groups[1].Value : queryIdMatch.Groups[1].Value;
                await ProcessSingleFileAsync(httpClient, apiKey, fileId, targetDirectory, onFileDownloadedAsync, result, cancellationToken);
            }
            else
            {
                result.Success = false;
                result.ErrorMessage = $"Não foi possível extrair um ID de Pasta ou Arquivo válido da URL: {link.Url}";
                return result;
            }

            result.Success = true;
            return result;
        }
        catch (Exception ex)
        {
            result.Success = false;
            result.ErrorMessage = $"Erro durante a ingestão do Google Drive: {ex.Message}";
            return result;
        }
    }

    private async Task ProcessFolderAsync(
        HttpClient httpClient,
        string apiKey,
        string folderId,
        string targetDirectory,
        Func<DiscoveredMediaFile, string, Task> onFileDownloadedAsync,
        IngestionProviderResult result,
        CancellationToken cancellationToken)
    {
        var listUrl = $"https://www.googleapis.com/drive/v3/files?q='{folderId}'+in+parents+and+trashed=false&fields=files(id,name,mimeType,size)&key={Uri.EscapeDataString(apiKey)}";
        var response = await httpClient.GetAsync(listUrl, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new Exception($"Erro na API do Google Drive ao listar pasta ({response.StatusCode}): {errorBody}");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);

        if (!doc.RootElement.TryGetProperty("files", out var filesArray)) return;

        foreach (var fileElement in filesArray.EnumerateArray())
        {
            if (cancellationToken.IsCancellationRequested) break;

            var id = fileElement.GetProperty("id").GetString() ?? string.Empty;
            var name = fileElement.GetProperty("name").GetString() ?? string.Empty;
            var mimeType = fileElement.GetProperty("mimeType").GetString() ?? string.Empty;

            long size = 0;
            if (fileElement.TryGetProperty("size", out var sizeProp))
            {
                long.TryParse(sizeProp.GetString(), out size);
            }

            if (mimeType == "application/vnd.google-apps.folder")
            {
                // Varredura recursiva de subpastas
                await ProcessFolderAsync(httpClient, apiKey, id, targetDirectory, onFileDownloadedAsync, result, cancellationToken);
            }
            else if (IsAllowedFile(name, mimeType))
            {
                var discovered = new DiscoveredMediaFile
                {
                    ExternalId = id,
                    FileName = name,
                    MimeType = mimeType,
                    FileSizeBytes = size,
                    DownloadUrl = $"https://www.googleapis.com/drive/v3/files/{id}?alt=media&key={Uri.EscapeDataString(apiKey)}"
                };

                var downloadedFilePath = await DownloadFileToDiskAsync(httpClient, discovered.DownloadUrl, targetDirectory, name, cancellationToken);
                result.DiscoveredFiles.Add(discovered);

                await onFileDownloadedAsync(discovered, downloadedFilePath);
            }
        }
    }

    private async Task ProcessSingleFileAsync(
        HttpClient httpClient,
        string apiKey,
        string fileId,
        string targetDirectory,
        Func<DiscoveredMediaFile, string, Task> onFileDownloadedAsync,
        IngestionProviderResult result,
        CancellationToken cancellationToken)
    {
        var metaUrl = $"https://www.googleapis.com/drive/v3/files/{fileId}?fields=id,name,mimeType,size&key={Uri.EscapeDataString(apiKey)}";
        var response = await httpClient.GetAsync(metaUrl, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var errorBody = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new Exception($"Erro na API do Google Drive ao obter arquivo ({response.StatusCode}): {errorBody}");
        }

        var json = await response.Content.ReadAsStringAsync(cancellationToken);
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;

        var name = root.GetProperty("name").GetString() ?? "file_media";
        var mimeType = root.GetProperty("mimeType").GetString() ?? "application/octet-stream";

        if (!IsAllowedFile(name, mimeType))
        {
            result.Success = false;
            result.ErrorMessage = $"O arquivo '{name}' foi bloqueado pelo filtro de segurança por conter extensão executável ou maliciosa.";
            return;
        }

        long size = 0;
        if (root.TryGetProperty("size", out var sizeProp))
        {
            long.TryParse(sizeProp.GetString(), out size);
        }

        var discovered = new DiscoveredMediaFile
        {
            ExternalId = fileId,
            FileName = name,
            MimeType = mimeType,
            FileSizeBytes = size,
            DownloadUrl = $"https://www.googleapis.com/drive/v3/files/{fileId}?alt=media&key={Uri.EscapeDataString(apiKey)}"
        };

        var downloadedFilePath = await DownloadFileToDiskAsync(httpClient, discovered.DownloadUrl, targetDirectory, name, cancellationToken);
        result.DiscoveredFiles.Add(discovered);

        await onFileDownloadedAsync(discovered, downloadedFilePath);
    }

    private static async Task<string> DownloadFileToDiskAsync(HttpClient httpClient, string downloadUrl, string targetDirectory, string originalFileName, CancellationToken cancellationToken)
    {
        var assetId = Guid.NewGuid();
        var sanitizedFileName = Path.GetFileName(originalFileName);
        var localFilePath = Path.Combine(targetDirectory, $"{assetId}_{sanitizedFileName}");

        using var response = await httpClient.GetAsync(downloadUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var contentStream = await response.Content.ReadAsStreamAsync(cancellationToken);
        await using var fileStream = new FileStream(localFilePath, FileMode.Create, FileAccess.Write, FileShare.None, 8192, true);

        await contentStream.CopyToAsync(fileStream, cancellationToken);
        return localFilePath;
    }

    private static bool IsAllowedFile(string fileName, string mimeType)
    {
        if (string.IsNullOrWhiteSpace(fileName)) return false;

        // Filtra lixo de sistema operacional e arquivos temporários de trava
        var baseName = Path.GetFileName(fileName);
        if (baseName.Equals(".DS_Store", StringComparison.OrdinalIgnoreCase) ||
            baseName.Equals("Thumbs.db", StringComparison.OrdinalIgnoreCase) ||
            baseName.Equals("desktop.ini", StringComparison.OrdinalIgnoreCase) ||
            baseName.StartsWith(".~lock.", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        var ext = Path.GetExtension(fileName);
        if (!string.IsNullOrWhiteSpace(ext) && BlockedExtensions.Contains(ext))
        {
            return false;
        }

        return true;
    }
}
