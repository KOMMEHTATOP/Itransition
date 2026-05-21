namespace InventoryApi.Models.Dto;

public record CommentDto(
    Guid Id,
    string AuthorId,
    string AuthorDisplayName,
    string Text,
    DateTime CreatedAt
);
