namespace InventoryApi.Models.Dto;

public record ItemFieldValueDto(
    Guid FieldId,
    string FieldTitle,
    string FieldType,
    string Value
);

public record ItemDetailDto(
    Guid Id,
    string CustomId,
    string AuthorId,
    string AuthorDisplayName,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int Version,
    Guid InventoryId,
    bool CanEdit,
    List<ItemFieldValueDto> FieldValues,
    int LikeCount,
    bool IsLikedByMe
);
