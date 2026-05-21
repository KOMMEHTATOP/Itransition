namespace InventoryApi.Models.Dto;

public record UpdateItemRequest(
    string CustomId,
    List<ItemFieldValueRequest>? FieldValues,
    int Version
);
