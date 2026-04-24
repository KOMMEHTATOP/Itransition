using System.Security.Claims;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/inventories/{inventoryId:guid}/fields")]
public class InventoryFieldsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public InventoryFieldsController(ApplicationDbContext db) => _db = db;

    // GET /api/inventories/{inventoryId}/fields
    [HttpGet]
    public async Task<ActionResult<List<InventoryFieldDto>>> GetFields(Guid inventoryId)
    {
        var inv = await _db.Inventories.AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId = UserId();
        var isAdmin = User.IsInRole("Admin");
        if (!inv.IsPublic && !isAdmin && inv.OwnerId != userId)
            return Forbid();

        var fields = await _db.InventoryFields
            .AsNoTracking()
            .Where(f => f.InventoryId == inventoryId)
            .OrderBy(f => f.Order)
            .Select(f => new InventoryFieldDto(f.Id, f.Title, f.Description, f.Type.ToString(), f.Order, f.ShowInTable))
            .ToListAsync();

        return fields;
    }

    // POST /api/inventories/{inventoryId}/fields
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<InventoryFieldDto>> CreateField(Guid inventoryId, CreateFieldRequest req)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId = UserId()!;
        var isAdmin = User.IsInRole("Admin");
        if (!CanModify(inv, userId, isAdmin)) return Forbid();

        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Title is required." });

        if (!Enum.TryParse<FieldType>(req.Type, out var fieldType))
            return BadRequest(new { message = $"Invalid field type: {req.Type}." });

        // Max 3 fields of the same type per inventory
        var typeCount = await _db.InventoryFields
            .CountAsync(f => f.InventoryId == inventoryId && f.Type == fieldType);
        if (typeCount >= 3)
            return BadRequest(new { message = $"Maximum 3 fields of type '{req.Type}' allowed per inventory." });

        var maxOrder = await _db.InventoryFields
            .Where(f => f.InventoryId == inventoryId)
            .MaxAsync(f => (int?)f.Order) ?? -1;

        var field = new InventoryField
        {
            Title       = req.Title.Trim(),
            Description = req.Description?.Trim() ?? string.Empty,
            Type        = fieldType,
            ShowInTable = req.ShowInTable,
            Order       = maxOrder + 1,
            InventoryId = inventoryId,
        };

        _db.InventoryFields.Add(field);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetFields), new { inventoryId },
            new InventoryFieldDto(field.Id, field.Title, field.Description, field.Type.ToString(), field.Order, field.ShowInTable));
    }

    // PUT /api/inventories/{inventoryId}/fields/{fieldId}
    [HttpPut("{fieldId:guid}")]
    [Authorize]
    public async Task<ActionResult<InventoryFieldDto>> UpdateField(Guid inventoryId, Guid fieldId, UpdateFieldRequest req)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId = UserId()!;
        var isAdmin = User.IsInRole("Admin");
        if (!CanModify(inv, userId, isAdmin)) return Forbid();

        var field = await _db.InventoryFields
            .FirstOrDefaultAsync(f => f.Id == fieldId && f.InventoryId == inventoryId);
        if (field is null) return NotFound();

        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Title is required." });

        field.Title       = req.Title.Trim();
        field.Description = req.Description?.Trim() ?? string.Empty;
        field.ShowInTable = req.ShowInTable;
        field.Order       = req.Order;

        await _db.SaveChangesAsync();

        return Ok(new InventoryFieldDto(field.Id, field.Title, field.Description, field.Type.ToString(), field.Order, field.ShowInTable));
    }

    // DELETE /api/inventories/{inventoryId}/fields/{fieldId}
    [HttpDelete("{fieldId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteField(Guid inventoryId, Guid fieldId)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId = UserId()!;
        var isAdmin = User.IsInRole("Admin");
        if (!CanModify(inv, userId, isAdmin)) return Forbid();

        var field = await _db.InventoryFields
            .FirstOrDefaultAsync(f => f.Id == fieldId && f.InventoryId == inventoryId);
        if (field is null) return NotFound();

        _db.InventoryFields.Remove(field);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // PUT /api/inventories/{inventoryId}/fields/reorder
    [HttpPut("reorder")]
    [Authorize]
    public async Task<IActionResult> ReorderFields(Guid inventoryId, [FromBody] List<Guid> orderedIds)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId = UserId()!;
        var isAdmin = User.IsInRole("Admin");
        if (!CanModify(inv, userId, isAdmin)) return Forbid();

        var fields = await _db.InventoryFields
            .Where(f => f.InventoryId == inventoryId)
            .ToListAsync();

        for (int i = 0; i < orderedIds.Count; i++)
        {
            var f = fields.FirstOrDefault(x => x.Id == orderedIds[i]);
            if (f is not null) f.Order = i;
        }

        await _db.SaveChangesAsync();
        return NoContent();
    }

    private string? UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private static bool CanModify(Inventory inv, string userId, bool isAdmin) =>
        isAdmin || inv.OwnerId == userId;
}
