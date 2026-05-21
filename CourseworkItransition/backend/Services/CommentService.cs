using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Hubs;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class CommentService : ICommentService
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<InventoryHub> _hub;

    public CommentService(ApplicationDbContext db, IHubContext<InventoryHub> hub)
    {
        _db = db;
        _hub = hub;
    }
    
    public async Task<Result<List<CommentDto>>> GetAll(Guid inventoryId, string? userId, bool isAdmin)
    {
        var inv = await _db.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result<List<CommentDto>>.Failure(ResultStatus.NotFound, "Not found");
        }

        var hasAccess = inv.IsPublic
                        || isAdmin
                        || inv.OwnerId == userId
                        || await _db.InventoryAccess.AnyAsync(a => a.InventoryId == inventoryId && a.UserId == userId);
        if (!hasAccess)
        {
            return Result<List<CommentDto>>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        var comments = await _db.Comments
            .Include(c => c.Author)
            .Where(c => c.InventoryId == inventoryId)
            .OrderBy(c => c.CreatedAt)
            .AsNoTracking()
            .ToListAsync();
        
        return Result<List<CommentDto>>.Success(comments.Select(c =>
            new CommentDto(c.Id, c.AuthorId, c.Author.DisplayName, c.Text, c.CreatedAt)
        ).ToList());
    }

    public async Task<Result<CommentDto>> Create(Guid inventoryId, string userId, bool isAdmin, CreateCommentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Text))
        {
            return  Result<CommentDto>.Failure(ResultStatus.Conflict, "Comment text is required");
        }

        var inv = await _db.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result<CommentDto>.Failure(ResultStatus.NotFound, "Not found");
        }

        var hasAccess = inv.IsPublic
                        || isAdmin
                        || inv.OwnerId == userId
                        || await _db.InventoryAccess.AnyAsync(a => a.InventoryId == inventoryId && a.UserId == userId);
        if (!hasAccess)
        {
            return Result<CommentDto>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        var comment = new Comment
        {
            InventoryId = inventoryId,
            AuthorId    = userId,
            Text        = req.Text.Trim(),
        };

        _db.Comments.Add(comment);
        await _db.SaveChangesAsync();
        await _db.Entry(comment).Reference(c => c.Author).LoadAsync();

        var dto = new CommentDto(
            comment.Id, 
            comment.AuthorId, 
            comment.Author.DisplayName,
            comment.Text, 
            comment.CreatedAt
        );

        await _hub.Clients.Group($"inv-{inventoryId}").SendAsync("NewComment", dto);
        
        return Result<CommentDto>.Success(dto);
    }
}