namespace CollabDraw.Server.DTOs;

public record CreateBoardRequest(string Name);

public record BoardListItem(
    Guid Id,
    string Name,
    DateTime CreatedAt,
    int UserCount,
    string? ThumbnailBase64
);

public record BoardDetailResponse(
    Guid Id,
    string Name,
    DateTime CreatedAt,
    Guid CreatedById,
    List<PageListItem> Pages,
    List<BoardUserItem> Users
);

public record PageListItem(Guid Id, string Title, int SortOrder);

public record BoardUserItem(Guid UserId, string DisplayName, string Role, DateTime JoinedAt);