using InventoryApi.Data;
using InventoryApi.Models.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/users")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public UsersController(ApplicationDbContext db) => _db = db;

    // GET /api/users/{id}/profile — public, no auth required
    [HttpGet("{id}/profile")]
    [AllowAnonymous]
    public async Task<ActionResult<UserPublicProfileDto>> GetProfile(string id)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        if (user is null || user.IsBlocked) return NotFound();

        var inventories = await _db.Inventories
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .Where(i => i.OwnerId == id && i.IsPublic)
            .OrderByDescending(i => i.CreatedAt)
            .Take(50)
            .AsNoTracking()
            .Select(i => new InventoryListItemDto(
                i.Id, i.Title, i.Description ?? string.Empty, i.ImageUrl,
                i.IsPublic, i.OwnerId, user.DisplayName, i.CreatedAt, i.UpdatedAt,
                i.Version, i.CategoryId, i.Category != null ? i.Category.Name : null,
                i.Tags.Select(t => t.TagName).ToList()))
            .ToListAsync();

        return new UserPublicProfileDto(user.Id, user.DisplayName, inventories);
    }

    // GET /api/users/search?q=john&limit=10
    [HttpGet("search")]
    [Authorize]
    public async Task<ActionResult<List<UserSearchResultDto>>> Search(string q = "", int limit = 10)
    {
        if (string.IsNullOrWhiteSpace(q)) return new List<UserSearchResultDto>();

        limit = Math.Clamp(limit, 1, 50);
        var lower = q.Trim().ToLowerInvariant();

        var users = await _db.Users
            .Where(u => !u.IsBlocked &&
                        (u.DisplayName.ToLower().Contains(lower) ||
                         (u.Email != null && u.Email.ToLower().Contains(lower))))
            .OrderBy(u => u.DisplayName)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync();

        return users.Select(u => new UserSearchResultDto(u.Id, u.DisplayName, u.Email ?? string.Empty))
                    .ToList();
    }
}
