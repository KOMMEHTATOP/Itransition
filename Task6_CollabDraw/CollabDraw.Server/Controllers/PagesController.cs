using CollabDraw.Server.Data;
using CollabDraw.Server.DTOs;
using CollabDraw.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CollabDraw.Server.Controllers;

[ApiController]
[Route("api/boards/{boardId:guid}/pages")]
public class PagesController : ControllerBase
{
    private readonly AppDbContext _db;

    public PagesController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/boards/{boardId}/pages
    [HttpGet]
    public async Task<ActionResult<List<PageListItem>>> GetAll(Guid boardId)
    {
        var pages = await _db.Pages
            .Where(p => p.BoardId == boardId)
            .OrderBy(p => p.SortOrder)
            .Select(p => new PageListItem(p.Id, p.Title, p.SortOrder))
            .ToListAsync();

        return Ok(pages);
    }

    // POST /api/boards/{boardId}/pages
    [HttpPost]
    public async Task<ActionResult<PageListItem>> Create(Guid boardId, [FromBody] CreatePageRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var hasAccess = await HasRole(boardId, user.Id, BoardRole.Editor);
        if (!hasAccess) return Forbid();

        var maxOrder = await _db.Pages
            .Where(p => p.BoardId == boardId)
            .MaxAsync(p => (int?)p.SortOrder) ?? -1;

        var page = new Page
        {
            Id = Guid.NewGuid(),
            BoardId = boardId,
            Title = string.IsNullOrWhiteSpace(request.Title) ? $"Page {maxOrder + 2}" : request.Title.Trim(),
            SortOrder = maxOrder + 1
        };

        _db.Pages.Add(page);
        await _db.SaveChangesAsync();

        return Created($"/api/boards/{boardId}/pages/{page.Id}",
            new PageListItem(page.Id, page.Title, page.SortOrder));
    }

    // PUT /api/boards/{boardId}/pages/{pageId}
    [HttpPut("{pageId:guid}")]
    public async Task<ActionResult<PageListItem>> Update(Guid boardId, Guid pageId, [FromBody] UpdatePageRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var hasAccess = await HasRole(boardId, user.Id, BoardRole.Editor);
        if (!hasAccess) return Forbid();

        var page = await _db.Pages.FirstOrDefaultAsync(p => p.Id == pageId && p.BoardId == boardId);
        if (page == null) return NotFound();

        if (!string.IsNullOrWhiteSpace(request.Title))
            page.Title = request.Title.Trim();

        if (request.SortOrder.HasValue)
            page.SortOrder = request.SortOrder.Value;

        await _db.SaveChangesAsync();

        return Ok(new PageListItem(page.Id, page.Title, page.SortOrder));
    }

    // DELETE /api/boards/{boardId}/pages/{pageId}
    [HttpDelete("{pageId:guid}")]
    public async Task<IActionResult> Delete(Guid boardId, Guid pageId)
    {
        var user = await GetCurrentUser();
        if (user == null) return Unauthorized();

        var hasAccess = await HasRole(boardId, user.Id, BoardRole.Editor);
        if (!hasAccess) return Forbid();

        var pageCount = await _db.Pages.CountAsync(p => p.BoardId == boardId);
        if (pageCount <= 1)
            return BadRequest("Cannot delete the last page.");

        var page = await _db.Pages.FirstOrDefaultAsync(p => p.Id == pageId && p.BoardId == boardId);
        if (page == null) return NotFound();

        _db.Pages.Remove(page);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // GET /api/boards/{boardId}/pages/{pageId}/elements
    [HttpGet("{pageId:guid}/elements")]
    public async Task<ActionResult<List<ElementResponse>>> GetElements(Guid boardId, Guid pageId)
    {
        var elements = await _db.Elements
            .Where(e => e.Page.BoardId == boardId && e.PageId == pageId && !e.IsDeleted)
            .OrderBy(e => e.ZIndex)
            .Select(e => new ElementResponse(e.Id, e.Type, e.Properties, e.ZIndex, e.Version, e.CreatedById))
            .ToListAsync();

        return Ok(elements);
    }

    private async Task<User?> GetCurrentUser()
    {
        if (Request.Headers.TryGetValue("X-User-Token", out var value)
            && Guid.TryParse(value, out var token))
            return await _db.Users.FirstOrDefaultAsync(u => u.Token == token);
        return null;
    }

    private async Task<bool> HasRole(Guid boardId, Guid userId, BoardRole minimumRole)
    {
        var bu = await _db.BoardUsers.FirstOrDefaultAsync(x => x.BoardId == boardId && x.UserId == userId);
        return bu != null && bu.Role >= minimumRole;
    }
}