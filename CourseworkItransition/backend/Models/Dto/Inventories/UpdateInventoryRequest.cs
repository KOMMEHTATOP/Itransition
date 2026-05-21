namespace InventoryApi.Models.Dto;

public record UpdateInventoryRequest(
    string Title,
    string? Description,
    bool IsPublic,
    int? CategoryId,
    int Version,
    string? ImageUrl,
    List<string>? Tags
);
