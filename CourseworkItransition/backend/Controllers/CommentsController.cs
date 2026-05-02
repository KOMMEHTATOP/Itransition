using System.Security.Claims;
using InventoryApi.Data;
using InventoryApi.Hubs;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/inventories/{inventoryId:guid}/comments")]
public class CommentsController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly IHubContext<InventoryHub> _hub;

    public CommentsController(ApplicationDbContext db, IHubContext<InventoryHub> hub)
    {
        _db  = db;
        _hub = hub;
    }

    // GET /api/inventories/{inventoryId}/comments
    [HttpGet]
    public async Task<ActionResult<List<CommentDto>>> GetAll(Guid inventoryId)
    {
        var inv = await _db.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId  = UserId();
        var isAdmin = User.IsInRole("Admin");

        var hasAccess = inv.IsPublic
            || isAdmin
            || inv.OwnerId == userId
            || await _db.InventoryAccess.AnyAsync(a => a.InventoryId == inventoryId && a.UserId == userId);
        if (!hasAccess) return Forbid();

        var comments = await _db.Comments
            .Include(c => c.Author)
            .Where(c => c.InventoryId == inventoryId)
            .OrderBy(c => c.CreatedAt)
            .AsNoTracking()
            .ToListAsync();

        return comments.Select(c =>
            new CommentDto(c.Id, c.AuthorId, c.Author.DisplayName, c.Text, c.CreatedAt)
        ).ToList();
    }

    // POST /api/inventories/{inventoryId}/comments
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<CommentDto>> Create(Guid inventoryId, CreateCommentRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Text))
            return BadRequest(new { message = "Comment text is required." });

        var inv = await _db.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId  = UserId()!;
        var isAdmin = User.IsInRole("Admin");

        var hasAccess = inv.IsPublic
            || isAdmin
            || inv.OwnerId == userId
            || await _db.InventoryAccess.AnyAsync(a => a.InventoryId == inventoryId && a.UserId == userId);
        if (!hasAccess) return Forbid();

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
            comment.Id, comment.AuthorId, comment.Author.DisplayName,
            comment.Text, comment.CreatedAt
        );

        await _hub.Clients.Group($"inv-{inventoryId}").SendAsync("NewComment", dto);

        return CreatedAtAction(nameof(GetAll), new { inventoryId }, dto);
    }

    private string? UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
}
