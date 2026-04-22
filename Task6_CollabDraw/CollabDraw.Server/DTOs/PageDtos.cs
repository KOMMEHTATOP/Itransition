namespace CollabDraw.Server.DTOs;

public record CreatePageRequest(string? Title);

public record UpdatePageRequest(string? Title, int? SortOrder);

public record ElementResponse(Guid Id, string Type, string Properties, int ZIndex, int Version, Guid CreatedById);