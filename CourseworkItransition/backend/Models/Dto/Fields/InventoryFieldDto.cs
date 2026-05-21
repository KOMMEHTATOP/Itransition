namespace InventoryApi.Models.Dto;

public record InventoryFieldDto(
    Guid Id,
    string Title,
    string Description,
    string Type,
    int Order,
    bool ShowInTable
);
