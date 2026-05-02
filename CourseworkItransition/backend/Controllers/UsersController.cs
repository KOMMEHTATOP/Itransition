using InventoryApi.Data;
using InventoryApi.Models.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public UsersController(ApplicationDbContext db) => _db = db;

    // GET /api/users/search?q=john&limit=10
    [HttpGet("search")]
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
