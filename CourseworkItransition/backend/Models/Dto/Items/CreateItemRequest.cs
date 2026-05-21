namespace InventoryApi.Models.Dto;

public record ItemFieldValueRequest(Guid FieldId, string Value);

public record CreateItemRequest(
    string CustomId,
    List<ItemFieldValueRequest>? FieldValues
);
