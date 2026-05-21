namespace InventoryApi.Models.Dto;

public record CreateInventoryRequest(
    string Title,
    string? Description,
    bool IsPublic,
    int? CategoryId
);
