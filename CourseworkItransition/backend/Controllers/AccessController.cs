using System.Security.Claims;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/inventories/{inventoryId:guid}/access")]
[Authorize]
public class AccessController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public AccessController(ApplicationDbContext db) => _db = db;

    // GET /api/inventories/{inventoryId}/access
    [HttpGet]
    public async Task<ActionResult<List<AccessUserDto>>> GetAccess(Guid inventoryId)
    {
        var inv = await _db.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();
        if (!CanManage(inv)) return Forbid();

        var grants = await _db.InventoryAccess
            .Where(a => a.InventoryId == inventoryId)
            .Include(a => a.User)
            .AsNoTracking()
            .ToListAsync();

        return grants.Select(a => new AccessUserDto(a.User.Id, a.User.DisplayName, a.User.Email ?? string.Empty))
                     .ToList();
    }

    // POST /api/inventories/{inventoryId}/access/{userId}
    [HttpPost("{userId}")]
    public async Task<IActionResult> GrantAccess(Guid inventoryId, string userId)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();
        if (!CanManage(inv)) return Forbid();

        if (inv.OwnerId == userId)
            return BadRequest(new { message = "Cannot grant access to the inventory owner." });

        var userExists = await _db.Users.AnyAsync(u => u.Id == userId);
        if (!userExists) return NotFound(new { message = "User not found." });

        var already = await _db.InventoryAccess.AnyAsync(a => a.InventoryId == inventoryId && a.UserId == userId);
        if (already) return Conflict(new { message = "User already has access." });

        _db.InventoryAccess.Add(new InventoryAccess { InventoryId = inventoryId, UserId = userId });
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/inventories/{inventoryId}/access  (batch by body)
    [HttpDelete]
    public async Task<IActionResult> RevokeAccess(Guid inventoryId, [FromBody] List<string> userIds)
    {
        if (userIds is null || userIds.Count == 0) return BadRequest();

        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();
        if (!CanManage(inv)) return Forbid();

        var grants = await _db.InventoryAccess
            .Where(a => a.InventoryId == inventoryId && userIds.Contains(a.UserId))
            .ToListAsync();

        _db.InventoryAccess.RemoveRange(grants);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private string? CurrentUserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);
    private bool CanManage(Inventory inv) => User.IsInRole("Admin") || inv.OwnerId == CurrentUserId();
}
