namespace InventoryApi.Models;

public enum CustomIdElementType
{
    Fixed,
    Random20bit,
    Random32bit,
    Random6digit,
    Random9digit,
    GUID,
    DateTime,
    Sequence,
}

public class CustomIdElement
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public CustomIdElementType Type { get; set; }
    public string FormatString { get; set; } = string.Empty;
    public int Order { get; set; }

    public Guid InventoryId { get; set; }
    public Inventory Inventory { get; set; } = null!;
}
