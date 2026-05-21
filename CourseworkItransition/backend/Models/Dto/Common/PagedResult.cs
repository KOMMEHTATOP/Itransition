namespace InventoryApi.Models.Dto;

public record PagedResult<T>(
    List<T> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);
