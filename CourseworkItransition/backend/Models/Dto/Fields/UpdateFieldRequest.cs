namespace InventoryApi.Models.Dto;

public record UpdateFieldRequest(
    string Title,
    string? Description,
    bool ShowInTable,
    int Order
);
