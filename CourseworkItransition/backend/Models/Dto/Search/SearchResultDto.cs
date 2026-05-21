namespace InventoryApi.Models.Dto;

public record InventorySearchResultDto(
    Guid Id,
    string Title,
    string Description,
    string OwnerDisplayName,
    DateTime CreatedAt,
    string? CategoryName
);

public record ItemSearchResultDto(
    Guid Id,
    string CustomId,
    string? Name,
    Guid InventoryId,
    string InventoryTitle,
    string AuthorDisplayName,
    DateTime CreatedAt
);

public record SearchResultDto(
    List<InventorySearchResultDto> Inventories,
    List<ItemSearchResultDto> Items
);
