namespace InventoryApi.Models;

public enum FieldType { Text, MultilineText, Number, Link, Boolean }

public class InventoryField
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public FieldType Type { get; set; }
    public int Order { get; set; }
    public bool ShowInTable { get; set; } = true;

    public Guid InventoryId { get; set; }
    public Inventory Inventory { get; set; } = null!;

    public ICollection<ItemFieldValue> FieldValues { get; set; } = [];
}
