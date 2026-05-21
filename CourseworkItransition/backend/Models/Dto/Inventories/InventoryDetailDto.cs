namespace InventoryApi.Models.Dto;

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
    bool CanEdit,
    List<string> Tags
);
