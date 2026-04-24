namespace InventoryApi.Models;

public class ItemFieldValue
{
    public Guid ItemId { get; set; }
    public Item Item { get; set; } = null!;

    public Guid FieldId { get; set; }
    public InventoryField Field { get; set; } = null!;

    public string Value { get; set; } = string.Empty;
}
