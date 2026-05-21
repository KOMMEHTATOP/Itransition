namespace InventoryApi.Models.Dto;

public record CategoryDto(int Id, string Name);

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
    string? CategoryName,
    List<string> Tags
);
