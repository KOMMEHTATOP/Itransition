using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface ICommentService
{
    Task<Result<List<CommentDto>>> GetAll(Guid inventoryId, string? userId, bool isAdmin);
    Task<Result<CommentDto>> Create(Guid inventoryId, string userId, bool isAdmin, CreateCommentRequest req);
}