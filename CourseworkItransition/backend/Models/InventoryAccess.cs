namespace InventoryApi.Models;

public class InventoryAccess
{
    public Guid InventoryId { get; set; }
    public string UserId { get; set; } = string.Empty;
    public Inventory Inventory { get; set; } = null!;
    public ApplicationUser User { get; set; } = null!;
}
