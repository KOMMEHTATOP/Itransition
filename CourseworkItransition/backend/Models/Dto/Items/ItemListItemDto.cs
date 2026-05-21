namespace InventoryApi.Models.Dto;

public record ItemListItemDto(
    Guid Id,
    string CustomId,
    string AuthorId,
    string AuthorDisplayName,
    DateTime CreatedAt,
    List<ItemFieldValueDto> FieldValues
);

public record ItemsPageDto(
    List<InventoryFieldDto> Fields,
    PagedResult<ItemListItemDto> Items,
    bool CanEdit,
    bool HasCustomIdFormat
);
