namespace CollabDraw.Server.Models;

public enum BoardRole
{
    Viewer,
    Editor,
    Admin,
    Owner
}

public class BoardUser
{
    public Guid Id { get; set; }
    public Guid BoardId { get; set; }
    public Guid UserId { get; set; }
    public BoardRole Role { get; set; } = BoardRole.Editor;
    public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

    public Board Board { get; set; } = null!;
    public User User { get; set; } = null!;
}