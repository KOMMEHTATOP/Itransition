namespace CollabDraw.Server.Models;

public class User
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public Guid Token { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;

    public ICollection<BoardUser> BoardUsers { get; set; } = new List<BoardUser>();
    public ICollection<Board> CreatedBoards { get; set; } = new List<Board>();
}