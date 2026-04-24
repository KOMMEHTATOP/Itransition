using System.Security.Claims;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers;

[ApiController]
public class ItemsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public ItemsController(ApplicationDbContext db) => _db = db;

    // GET /api/inventories/{inventoryId}/items
    [HttpGet("api/inventories/{inventoryId:guid}/items")]
    public async Task<ActionResult<ItemsPageDto>> GetItems(
        Guid inventoryId, int page = 1, int pageSize = 20, string sort = "newest")
    {
        var inv = await _db.Inventories.AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId = UserId();
        var isAdmin = User.IsInRole("Admin");
        if (!inv.IsPublic && !isAdmin && inv.OwnerId != userId)
            return Forbid();

        var canEdit = isAdmin || inv.OwnerId == userId;

        var fields = await _db.InventoryFields
            .AsNoTracking()
            .Where(f => f.InventoryId == inventoryId)
            .OrderBy(f => f.Order)
            .ToListAsync();

        var query = _db.Items
            .Include(i => i.Author)
            .Include(i => i.FieldValues).ThenInclude(v => v.Field)
            .Where(i => i.InventoryId == inventoryId)
            .AsNoTracking();

        query = sort switch
        {
            "oldest"   => query.OrderBy(i => i.CreatedAt),
            "customId" => query.OrderBy(i => i.CustomId),
            _          => query.OrderByDescending(i => i.CreatedAt),
        };

        pageSize = Math.Clamp(pageSize, 1, 100);
        page     = Math.Max(1, page);

        var total      = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        var items      = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var fieldDtos = fields.Select(f =>
            new InventoryFieldDto(f.Id, f.Title, f.Description, f.Type.ToString(), f.Order, f.ShowInTable)
        ).ToList();

        var itemDtos = items.Select(item => ToListDto(item)).ToList();

        return Ok(new ItemsPageDto(
            fieldDtos,
            new PagedResult<ItemListItemDto>(itemDtos, total, page, pageSize, totalPages),
            canEdit
        ));
    }

    // POST /api/inventories/{inventoryId}/items
    [HttpPost("api/inventories/{inventoryId:guid}/items")]
    [Authorize]
    public async Task<ActionResult<ItemDetailDto>> CreateItem(Guid inventoryId, CreateItemRequest req)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId = UserId()!;
        var isAdmin = User.IsInRole("Admin");

        if (!inv.IsPublic && !isAdmin && inv.OwnerId != userId)
            return Forbid();

        if (!string.IsNullOrWhiteSpace(req.CustomId))
        {
            var exists = await _db.Items.AnyAsync(i => i.InventoryId == inventoryId && i.CustomId == req.CustomId.Trim());
            if (exists) return Conflict(new { message = "An item with this Custom ID already exists in this inventory." });
        }

        var item = new Item
        {
            CustomId    = req.CustomId?.Trim() ?? string.Empty,
            InventoryId = inventoryId,
            AuthorId    = userId,
        };

        _db.Items.Add(item);

        if (req.FieldValues?.Count > 0)
        {
            var fieldIds    = req.FieldValues.Select(v => v.FieldId).ToHashSet();
            var validFields = await _db.InventoryFields
                .Where(f => f.InventoryId == inventoryId && fieldIds.Contains(f.Id))
                .ToListAsync();

            foreach (var v in req.FieldValues)
            {
                if (validFields.Any(f => f.Id == v.FieldId))
                {
                    _db.ItemFieldValues.Add(new ItemFieldValue
                    {
                        ItemId  = item.Id,
                        FieldId = v.FieldId,
                        Value   = v.Value ?? string.Empty,
                    });
                }
            }
        }

        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(i => i.Author).LoadAsync();
        await _db.Entry(item).Reference(i => i.Inventory).LoadAsync();
        await _db.Entry(item).Collection(i => i.FieldValues).Query()
            .Include(v => v.Field).LoadAsync();

        return CreatedAtAction(nameof(GetItem), new { id = item.Id },
            ToDetailDto(item, userId, isAdmin));
    }

    // GET /api/items/{id}
    [HttpGet("api/items/{id:guid}")]
    public async Task<ActionResult<ItemDetailDto>> GetItem(Guid id)
    {
        var item = await _db.Items
            .Include(i => i.Author)
            .Include(i => i.Inventory)
            .Include(i => i.FieldValues).ThenInclude(v => v.Field)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id);

        if (item is null) return NotFound();

        var userId  = UserId();
        var isAdmin = User.IsInRole("Admin");

        if (!item.Inventory.IsPublic && !isAdmin && item.Inventory.OwnerId != userId)
            return Forbid();

        return Ok(ToDetailDto(item, userId, isAdmin));
    }

    // PUT /api/items/{id}
    [HttpPut("api/items/{id:guid}")]
    [Authorize]
    public async Task<ActionResult<ItemDetailDto>> UpdateItem(Guid id, UpdateItemRequest req)
    {
        var item = await _db.Items
            .Include(i => i.Author)
            .Include(i => i.Inventory)
            .Include(i => i.FieldValues).ThenInclude(v => v.Field)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (item is null) return NotFound();

        var userId  = UserId()!;
        var isAdmin = User.IsInRole("Admin");

        if (!CanModifyItem(item, userId, isAdmin)) return Forbid();

        if (item.Version != req.Version)
            return Conflict(new { message = "Save conflict: the item was modified by someone else. Please reload." });

        var newCustomId = req.CustomId?.Trim() ?? string.Empty;
        if (newCustomId != item.CustomId && !string.IsNullOrWhiteSpace(newCustomId))
        {
            var exists = await _db.Items.AnyAsync(i =>
                i.InventoryId == item.InventoryId && i.CustomId == newCustomId && i.Id != id);
            if (exists) return Conflict(new { message = "An item with this Custom ID already exists in this inventory." });
        }

        item.CustomId  = newCustomId;
        item.UpdatedAt = DateTime.UtcNow;
        item.Version  += 1;

        if (req.FieldValues is not null)
        {
            var updatedFieldIds = req.FieldValues.Select(v => v.FieldId).ToHashSet();
            var toRemove        = item.FieldValues.Where(v => updatedFieldIds.Contains(v.FieldId)).ToList();
            _db.ItemFieldValues.RemoveRange(toRemove);

            var validFields = await _db.InventoryFields
                .Where(f => f.InventoryId == item.InventoryId && updatedFieldIds.Contains(f.Id))
                .ToListAsync();

            foreach (var v in req.FieldValues)
            {
                if (validFields.Any(f => f.Id == v.FieldId))
                {
                    _db.ItemFieldValues.Add(new ItemFieldValue
                    {
                        ItemId  = item.Id,
                        FieldId = v.FieldId,
                        Value   = v.Value ?? string.Empty,
                    });
                }
            }
        }

        try { await _db.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { message = "Save conflict: the item was modified by someone else. Please reload." });
        }

        await _db.Entry(item).Collection(i => i.FieldValues).Query()
            .Include(v => v.Field).LoadAsync();

        return Ok(ToDetailDto(item, userId, isAdmin));
    }

    // DELETE /api/items/{id}
    [HttpDelete("api/items/{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteItem(Guid id)
    {
        var item = await _db.Items
            .Include(i => i.Inventory)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (item is null) return NotFound();

        var userId  = UserId()!;
        var isAdmin = User.IsInRole("Admin");

        if (!CanModifyItem(item, userId, isAdmin)) return Forbid();

        _db.Items.Remove(item);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/inventories/{inventoryId}/items  (batch)
    [HttpDelete("api/inventories/{inventoryId:guid}/items")]
    [Authorize]
    public async Task<IActionResult> DeleteItems(Guid inventoryId, [FromBody] List<Guid> ids)
    {
        if (ids is null || ids.Count == 0) return BadRequest();

        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null) return NotFound();

        var userId  = UserId()!;
        var isAdmin = User.IsInRole("Admin");

        if (!CanModifyInventory(inv, userId, isAdmin)) return Forbid();

        var items = await _db.Items
            .Where(i => i.InventoryId == inventoryId && ids.Contains(i.Id))
            .ToListAsync();

        _db.Items.RemoveRange(items);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // --- helpers ---

    private string? UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private static bool CanModifyInventory(Inventory inv, string userId, bool isAdmin) =>
        isAdmin || inv.OwnerId == userId;

    private static bool CanModifyItem(Item item, string userId, bool isAdmin) =>
        isAdmin || item.Inventory.OwnerId == userId || item.AuthorId == userId;

    private static ItemDetailDto ToDetailDto(Item item, string? userId, bool isAdmin) =>
        new(
            item.Id,
            item.CustomId,
            item.AuthorId,
            item.Author.DisplayName,
            item.CreatedAt,
            item.UpdatedAt,
            item.Version,
            item.InventoryId,
            CanEdit: isAdmin || item.Inventory?.OwnerId == userId || item.AuthorId == userId,
            item.FieldValues
                .OrderBy(v => v.Field.Order)
                .Select(v => new ItemFieldValueDto(v.FieldId, v.Field.Title, v.Field.Type.ToString(), v.Value))
                .ToList()
        );

    private static ItemListItemDto ToListDto(Item item) =>
        new(
            item.Id,
            item.CustomId,
            item.AuthorId,
            item.Author.DisplayName,
            item.CreatedAt,
            item.FieldValues
                .OrderBy(v => v.Field.Order)
                .Select(v => new ItemFieldValueDto(v.FieldId, v.Field.Title, v.Field.Type.ToString(), v.Value))
                .ToList()
        );
}
