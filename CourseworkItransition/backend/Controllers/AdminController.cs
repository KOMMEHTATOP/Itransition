using System.Security.Claims;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ApplicationDbContext _db;

    public AdminController(UserManager<ApplicationUser> userManager, ApplicationDbContext db)
    {
        _userManager = userManager;
        _db = db;
    }

    // GET /api/admin/users
    [HttpGet("users")]
    public async Task<ActionResult<List<AdminUserDto>>> GetUsers()
    {
        var users = await _db.Users
            .OrderBy(u => u.DisplayName)
            .AsNoTracking()
            .ToListAsync();

        var adminIds = (await _userManager.GetUsersInRoleAsync("Admin"))
            .Select(u => u.Id)
            .ToHashSet();

        var inventoryCounts = await _db.Inventories
            .GroupBy(i => i.OwnerId)
            .Select(g => new { OwnerId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.OwnerId, x => x.Count);

        return users.Select(u => new AdminUserDto(
            u.Id,
            u.DisplayName,
            u.Email ?? string.Empty,
            u.IsBlocked,
            adminIds.Contains(u.Id),
            u.CreatedAt,
            inventoryCounts.GetValueOrDefault(u.Id, 0)
        )).ToList();
    }

    // POST /api/admin/users/block
    [HttpPost("users/block")]
    public async Task<IActionResult> Block([FromBody] BatchIdsRequest req)
    {
        var currentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var users = await _db.Users.Where(u => req.Ids.Contains(u.Id) && u.Id != currentId).ToListAsync();
        foreach (var u in users) u.IsBlocked = true;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/admin/users/unblock
    [HttpPost("users/unblock")]
    public async Task<IActionResult> Unblock([FromBody] BatchIdsRequest req)
    {
        var users = await _db.Users.Where(u => req.Ids.Contains(u.Id)).ToListAsync();
        foreach (var u in users) u.IsBlocked = false;
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/admin/users
    [HttpDelete("users")]
    public async Task<IActionResult> Delete([FromBody] BatchIdsRequest req)
    {
        var currentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var users = await _db.Users.Where(u => req.Ids.Contains(u.Id) && u.Id != currentId).ToListAsync();
        _db.Users.RemoveRange(users);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // POST /api/admin/users/promote
    [HttpPost("users/promote")]
    public async Task<IActionResult> Promote([FromBody] BatchIdsRequest req)
    {
        foreach (var id in req.Ids)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) continue;
            if (!await _userManager.IsInRoleAsync(user, "Admin"))
                await _userManager.AddToRoleAsync(user, "Admin");
        }
        return NoContent();
    }

    // POST /api/admin/users/demote
    [HttpPost("users/demote")]
    public async Task<IActionResult> Demote([FromBody] BatchIdsRequest req)
    {
        foreach (var id in req.Ids)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null) continue;
            if (await _userManager.IsInRoleAsync(user, "Admin"))
                await _userManager.RemoveFromRoleAsync(user, "Admin");
        }
        return NoContent();
    }
}

public record BatchIdsRequest(List<string> Ids);
