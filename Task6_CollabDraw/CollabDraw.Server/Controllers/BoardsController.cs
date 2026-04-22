using CollabDraw.Server.Data;
using CollabDraw.Server.DTOs;
using CollabDraw.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CollabDraw.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BoardsController : ControllerBase
{
    private readonly AppDbContext _db;

    public BoardsController(AppDbContext db)
    {
        _db = db;
    }

    // GET /api/boards
    [HttpGet]
    public async Task<ActionResult<List<BoardListItem>>> GetAll()
    {
        var boards = await _db.Boards
            .OrderByDescending(b => b.UpdatedAt)
            .Select(b => new BoardListItem(
                b.Id,
                b.Name,
                b.CreatedAt,
                b.BoardUsers.Count,
                b.Thumbnail != null ? Convert.ToBase64String(b.Thumbnail) : null
            ))
            .ToListAsync();

        return Ok(boards);
    }

    // GET /api/boards/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<BoardDetailResponse>> GetById(Guid id)
    {
        var board = await _db.Boards
            .Include(b => b.Pages.OrderBy(p => p.SortOrder))
            .Include(b => b.BoardUsers)
                .ThenInclude(bu => bu.User)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (board == null)
            return NotFound();

        return Ok(new BoardDetailResponse(
            board.Id,
            board.Name,
            board.CreatedAt,
            board.CreatedById,
            board.Pages.Select(p => new PageListItem(p.Id, p.Title, p.SortOrder)).ToList(),
            board.BoardUsers.Select(bu => new BoardUserItem(
                bu.UserId, bu.User.DisplayName, bu.Role.ToString(), bu.JoinedAt
            )).ToList()
        ));
    }

    // POST /api/boards
    [HttpPost]
    public async Task<ActionResult<BoardDetailResponse>> Create([FromBody] CreateBoardRequest request)
    {
        var user = await GetCurrentUser();
        if (user == null)
            return Unauthorized("Missing or invalid X-User-Token.");

        if (string.IsNullOrWhiteSpace(request.Name) || request.Name.Length > 100)
            return BadRequest("Board name must be 1-100 characters.");

        var board = new Board
        {
            Id = Guid.NewGuid(),
            Name = request.Name.Trim(),
            CreatedById = user.Id
        };

        var firstPage = new Page
        {
            Id = Guid.NewGuid(),
            BoardId = board.Id,
            Title = "Page 1",
            SortOrder = 0
        };

        var boardUser = new BoardUser
        {
            Id = Guid.NewGuid(),
            BoardId = board.Id,
            UserId = user.Id,
            Role = BoardRole.Owner
        };

        _db.Boards.Add(board);
        _db.Pages.Add(firstPage);
        _db.BoardUsers.Add(boardUser);
        await _db.SaveChangesAsync();

        return Created($"/api/boards/{board.Id}", new BoardDetailResponse(
            board.Id,
            board.Name,
            board.CreatedAt,
            board.CreatedById,
            new List<PageListItem> { new(firstPage.Id, firstPage.Title, firstPage.SortOrder) },
            new List<BoardUserItem> { new(user.Id, user.DisplayName, BoardRole.Owner.ToString(), boardUser.JoinedAt) }
        ));
    }

    // DELETE /api/boards/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var user = await GetCurrentUser();
        if (user == null)
            return Unauthorized();

        var board = await _db.Boards
            .Include(b => b.BoardUsers)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (board == null)
            return NotFound();

        var role = board.BoardUsers.FirstOrDefault(bu => bu.UserId == user.Id)?.Role;
        if (role != BoardRole.Owner)
            return Forbid();

        _db.Boards.Remove(board);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<User?> GetCurrentUser()
    {
        if (Request.Headers.TryGetValue("X-User-Token", out var value)
            && Guid.TryParse(value, out var token))
            return await _db.Users.FirstOrDefaultAsync(u => u.Token == token);
        return null;
    }
}