namespace InventoryApi.Models.Dto;

public record InventoryListItemDto(
    Guid Id,
    string Title,
    string Description,
    string? ImageUrl,
    bool IsPublic,
    string OwnerId,
    string OwnerDisplayName,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int Version,
    int? CategoryId,
    string? CategoryName
);

public record InventoryDetailDto(
    Guid Id,
    string Title,
    string Description,
    string? ImageUrl,
    bool IsPublic,
    string OwnerId,
    string OwnerDisplayName,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int Version,
    int? CategoryId,
    string? CategoryName,
    bool CanEdit
);

public record CategoryDto(int Id, string Name);

public record CreateInventoryRequest(
    string Title,
    string? Description,
    bool IsPublic,
    int? CategoryId
);

public record UpdateInventoryRequest(
    string Title,
    string? Description,
    bool IsPublic,
    int? CategoryId,
    int Version
);

public record PagedResult<T>(
    List<T> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);
