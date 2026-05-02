using System.Security.Claims;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/inventories/{inventoryId:guid}/customid")]
public class CustomIdController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly CustomIdGeneratorService _generator;

    public CustomIdController(ApplicationDbContext db, CustomIdGeneratorService generator)
    {
        _db        = db;
        _generator = generator;
    }

    // GET /api/inventories/{inventoryId}/customid
    [HttpGet]
    public async Task<ActionResult<List<CustomIdElementDto>>> GetElements(Guid inventoryId)
    {
        var inv = await _db.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId  = UserId();
        var isAdmin = User.IsInRole("Admin");
        if (!inv.IsPublic && !isAdmin && inv.OwnerId != userId) return Forbid();

        var elements = await _db.CustomIdElements
            .AsNoTracking()
            .Where(e => e.InventoryId == inventoryId)
            .OrderBy(e => e.Order)
            .ToListAsync();

        return elements.Select(ToDto).ToList();
    }

    // POST /api/inventories/{inventoryId}/customid
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<CustomIdElementDto>> AddElement(Guid inventoryId, CreateCustomIdElementRequest req)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId  = UserId()!;
        var isAdmin = User.IsInRole("Admin");
        if (!CanModify(inv, userId, isAdmin)) return Forbid();

        if (!Enum.TryParse<CustomIdElementType>(req.Type, out var type))
            return BadRequest(new { message = "Invalid element type." });

        var count = await _db.CustomIdElements.CountAsync(e => e.InventoryId == inventoryId);
        if (count >= 10)
            return BadRequest(new { message = "Maximum 10 elements allowed." });

        var el = new CustomIdElement
        {
            InventoryId  = inventoryId,
            Type         = type,
            FormatString = req.FormatString ?? string.Empty,
            Order        = count,
        };

        _db.CustomIdElements.Add(el);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetElements), new { inventoryId }, ToDto(el));
    }

    // PUT /api/inventories/{inventoryId}/customid/{elementId}
    [HttpPut("{elementId:guid}")]
    [Authorize]
    public async Task<ActionResult<CustomIdElementDto>> UpdateElement(
        Guid inventoryId, Guid elementId, UpdateCustomIdElementRequest req)
    {
        var el = await _db.CustomIdElements
            .Include(e => e.Inventory)
            .FirstOrDefaultAsync(e => e.Id == elementId && e.InventoryId == inventoryId);
        if (el is null) return NotFound();

        var userId  = UserId()!;
        var isAdmin = User.IsInRole("Admin");
        if (!CanModify(el.Inventory, userId, isAdmin)) return Forbid();

        if (!Enum.TryParse<CustomIdElementType>(req.Type, out var type))
            return BadRequest(new { message = "Invalid element type." });

        el.Type         = type;
        el.FormatString = req.FormatString ?? string.Empty;
        el.Order        = req.Order;

        await _db.SaveChangesAsync();
        return Ok(ToDto(el));
    }

    // DELETE /api/inventories/{inventoryId}/customid/{elementId}
    [HttpDelete("{elementId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteElement(Guid inventoryId, Guid elementId)
    {
        var el = await _db.CustomIdElements
            .Include(e => e.Inventory)
            .FirstOrDefaultAsync(e => e.Id == elementId && e.InventoryId == inventoryId);
        if (el is null) return NotFound();

        var userId  = UserId()!;
        var isAdmin = User.IsInRole("Admin");
        if (!CanModify(el.Inventory, userId, isAdmin)) return Forbid();

        _db.CustomIdElements.Remove(el);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // PUT /api/inventories/{inventoryId}/customid/reorder
    [HttpPut("reorder")]
    [Authorize]
    public async Task<IActionResult> Reorder(Guid inventoryId, [FromBody] List<Guid> orderedIds)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId  = UserId()!;
        var isAdmin = User.IsInRole("Admin");
        if (!CanModify(inv, userId, isAdmin)) return Forbid();

        var elements = await _db.CustomIdElements
            .Where(e => e.InventoryId == inventoryId)
            .ToListAsync();

        for (var i = 0; i < orderedIds.Count; i++)
        {
            var el = elements.FirstOrDefault(e => e.Id == orderedIds[i]);
            if (el is not null) el.Order = i;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET /api/inventories/{inventoryId}/customid/preview
    [HttpGet("preview")]
    [Authorize]
    public async Task<ActionResult<string>> Preview(Guid inventoryId)
    {
        var inv = await _db.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId  = UserId()!;
        var isAdmin = User.IsInRole("Admin");
        if (!CanModify(inv, userId, isAdmin)) return Forbid();

        return Ok(await _generator.GenerateAsync(inventoryId));
    }

    private string? UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private static bool CanModify(Inventory inv, string userId, bool isAdmin) =>
        isAdmin || inv.OwnerId == userId;

    private static CustomIdElementDto ToDto(CustomIdElement el) =>
        new(el.Id, el.Type.ToString(), el.FormatString, el.Order);
}
