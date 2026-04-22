namespace CollabDraw.Server.Models;

public class Board
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public Guid CreatedById { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public byte[]? Thumbnail { get; set; }

    public User CreatedBy { get; set; } = null!;
    public ICollection<Page> Pages { get; set; } = new List<Page>();
    public ICollection<BoardUser> BoardUsers { get; set; } = new List<BoardUser>();
}
