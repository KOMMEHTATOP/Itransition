namespace InventoryApi.Models;

public class InventoryTag
{
    public Guid InventoryId { get; set; }
    public string TagName { get; set; } = string.Empty;
    public Inventory Inventory { get; set; } = null!;
}
