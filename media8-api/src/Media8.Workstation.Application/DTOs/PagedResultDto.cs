namespace Media8.Workstation.Application.DTOs;

/// <summary>
/// DTO padronizado de resposta paginada para listas da API (em PascalCase).
/// </summary>
/// <typeparam name="T">Tipo do item retornado.</typeparam>
public class PagedResultDto<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public long TotalCount { get; set; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public bool HasNextPage => Page < TotalPages;
}
