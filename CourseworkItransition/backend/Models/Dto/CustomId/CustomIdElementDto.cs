namespace InventoryApi.Models.Dto;

public record CustomIdElementDto(Guid Id, string Type, string FormatString, int Order);
