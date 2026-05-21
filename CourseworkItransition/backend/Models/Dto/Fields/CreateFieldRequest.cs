namespace InventoryApi.Models.Dto;

public record CreateFieldRequest(
    string Title,
    string? Description,
    string Type,
    bool ShowInTable
);
