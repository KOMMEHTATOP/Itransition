namespace InventoryApi.Models;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;

    public ICollection<Inventory> Inventories { get; set; } = [];
}
