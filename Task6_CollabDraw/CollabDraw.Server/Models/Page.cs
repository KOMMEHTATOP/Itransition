namespace CollabDraw.Server.Models;

public class Page
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public string Title { get; set; } = "Page 1";
    public int SortOrder { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Board Board { get; set; } = null!;
    public ICollection<Element> Elements { get; set; } = new List<Element>();
}