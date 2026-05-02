namespace InventoryApi.Models;

public class Item
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CustomId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;

    public Guid InventoryId { get; set; }
    public Inventory Inventory { get; set; } = null!;

    public string AuthorId { get; set; } = string.Empty;
    public ApplicationUser Author { get; set; } = null!;

    public ICollection<ItemFieldValue> FieldValues { get; set; } = [];
    public ICollection<ItemLike> Likes { get; set; } = [];
}
