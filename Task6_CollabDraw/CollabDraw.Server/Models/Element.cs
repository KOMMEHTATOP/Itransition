namespace CollabDraw.Server.Models;

public class Element
{
    public Guid Id { get; set; }
    public Guid PageId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Properties { get; set; } = "{}";
    public int ZIndex { get; set; }
    public int Version { get; set; } = 1;
    public Guid CreatedById { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }

    public Page Page { get; set; } = null!;
    public User CreatedBy { get; set; } = null!;
}