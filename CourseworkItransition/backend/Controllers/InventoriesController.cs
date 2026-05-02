using System.Security.Claims;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InventoriesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public InventoriesController(ApplicationDbContext db) => _db = db;

    // GET /api/inventories?page=1&pageSize=20&sort=newest
    [HttpGet]
    public async Task<ActionResult<PagedResult<InventoryListItemDto>>> GetAll(
        int page = 1, int pageSize = 20, string sort = "newest")
    {
        var query = _db.Inventories
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .Where(i => i.IsPublic)
            .AsNoTracking();

        query = sort switch
        {
            "oldest" => query.OrderBy(i => i.CreatedAt),
            "title"  => query.OrderBy(i => i.Title),
            _        => query.OrderByDescending(i => i.CreatedAt),
        };

        return await ToPagedResult(query, page, pageSize);
    }

    // GET /api/inventories/my?page=1&pageSize=20
    [HttpGet("my")]
    [Authorize]
    public async Task<ActionResult<PagedResult<InventoryListItemDto>>> GetMy(
        int page = 1, int pageSize = 20, string sort = "newest")
    {
        var userId = UserId();
        var query = _db.Inventories
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .Where(i => i.OwnerId == userId)
            .AsNoTracking();

        query = sort switch
        {
            "oldest" => query.OrderBy(i => i.CreatedAt),
            "title"  => query.OrderBy(i => i.Title),
            _        => query.OrderByDescending(i => i.CreatedAt),
        };

        return await ToPagedResult(query, page, pageSize);
    }

    // GET /api/inventories/accessible?page=1&pageSize=20
    // Returns public inventories + inventories where user has explicit access (excluding own)
    [HttpGet("accessible")]
    [Authorize]
    public async Task<ActionResult<PagedResult<InventoryListItemDto>>> GetAccessible(
        int page = 1, int pageSize = 20, string sort = "newest")
    {
        var userId = UserId()!;
        var query = _db.Inventories
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .Where(i => i.OwnerId != userId &&
                        (i.IsPublic || i.AccessGrants.Any(a => a.UserId == userId)))
            .AsNoTracking();

        query = sort switch
        {
            "oldest" => query.OrderBy(i => i.CreatedAt),
            "title"  => query.OrderBy(i => i.Title),
            _        => query.OrderByDescending(i => i.CreatedAt),
        };

        return await ToPagedResult(query, page, pageSize);
    }

    // GET /api/inventories/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<InventoryDetailDto>> GetById(Guid id)
    {
        var inv = await _db.Inventories
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id);

        if (inv is null) return NotFound();

        var userId = UserId();
        var isAdmin = User.IsInRole("Admin");

        var hasAccess = inv.IsPublic
            || isAdmin
            || inv.OwnerId == userId
            || await _db.InventoryAccess.AnyAsync(a => a.InventoryId == id && a.UserId == userId);

        if (!hasAccess) return Forbid();

        return ToDetailDto(inv, userId, isAdmin);
    }

    // GET /api/inventories/categories
    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> GetCategories()
    {
        var cats = await _db.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name))
            .ToListAsync();
        return cats;
    }

    // POST /api/inventories
    [HttpPost]
    [Authorize]
    public async Task<ActionResult<InventoryDetailDto>> Create(CreateInventoryRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
            return BadRequest(new { message = "Title is required." });

        var userId = UserId()!;
        var inventory = new Inventory
        {
            Title       = req.Title.Trim(),
            Description = req.Description?.Trim() ?? string.Empty,
            IsPublic    = req.IsPublic,
            CategoryId  = req.CategoryId,
            OwnerId     = userId,
        };

        _db.Inventories.Add(inventory);
        await _db.SaveChangesAsync();

        await _db.Entry(inventory).Reference(i => i.Owner).LoadAsync();
        await _db.Entry(inventory).Reference(i => i.Category).LoadAsync();

        return CreatedAtAction(nameof(GetById), new { id = inventory.Id },
            ToDetailDto(inventory, userId, User.IsInRole("Admin")));
    }

    // PUT /api/inventories/{id}
    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, UpdateInventoryRequest req)
    {
        var inventory = await _db.Inventories
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (inventory is null) return NotFound();

        var userId = UserId()!;
        var isAdmin = User.IsInRole("Admin");
        if (!CanModify(inventory, userId, isAdmin)) return Forbid();

        if (inventory.Version != req.Version)
            return Conflict(new { message = "Save conflict: the inventory was modified by someone else. Please reload." });

        inventory.Title       = req.Title.Trim();
        inventory.Description = req.Description?.Trim() ?? string.Empty;
        inventory.IsPublic    = req.IsPublic;
        inventory.CategoryId  = req.CategoryId;
        inventory.ImageUrl    = req.ImageUrl;
        inventory.UpdatedAt   = DateTime.UtcNow;
        inventory.Version    += 1;

        if (req.Tags is not null)
        {
            _db.InventoryTags.RemoveRange(inventory.Tags);
            var newTags = req.Tags
                .Select(t => t.Trim().ToLowerInvariant())
                .Where(t => t.Length > 0)
                .Distinct()
                .Select(t => new InventoryTag { InventoryId = id, TagName = t });
            _db.InventoryTags.AddRange(newTags);
        }

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Conflict(new { message = "Save conflict: the inventory was modified by someone else. Please reload." });
        }

        await _db.Entry(inventory).Collection(i => i.Tags).LoadAsync();
        return Ok(ToDetailDto(inventory, userId, isAdmin));
    }

    // DELETE /api/inventories/{id}
    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        var inventory = await _db.Inventories.FindAsync(id);
        if (inventory is null) return NotFound();

        var userId = UserId()!;
        if (!CanModify(inventory, userId, User.IsInRole("Admin"))) return Forbid();

        _db.Inventories.Remove(inventory);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // DELETE /api/inventories  (batch)
    [HttpDelete]
    [Authorize]
    public async Task<IActionResult> DeleteBatch([FromBody] List<Guid> ids)
    {
        if (ids is null || ids.Count == 0) return BadRequest();

        var userId = UserId()!;
        var isAdmin = User.IsInRole("Admin");

        var inventories = await _db.Inventories
            .Where(i => ids.Contains(i.Id))
            .ToListAsync();

        foreach (var inv in inventories)
        {
            if (!CanModify(inv, userId, isAdmin))
                return Forbid();
        }

        _db.Inventories.RemoveRange(inventories);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // --- helpers ---

    private string? UserId() => User.FindFirstValue(ClaimTypes.NameIdentifier);

    private static bool CanModify(Inventory inv, string userId, bool isAdmin) =>
        isAdmin || inv.OwnerId == userId;

    private static InventoryDetailDto ToDetailDto(Inventory inv, string? userId, bool isAdmin) =>
        new(
            inv.Id,
            inv.Title,
            inv.Description,
            inv.ImageUrl,
            inv.IsPublic,
            inv.OwnerId,
            inv.Owner.DisplayName,
            inv.CreatedAt,
            inv.UpdatedAt,
            inv.Version,
            inv.CategoryId,
            inv.Category?.Name,
            CanEdit: isAdmin || inv.OwnerId == userId,
            Tags: inv.Tags.Select(t => t.TagName).OrderBy(t => t).ToList()
        );

    private static InventoryListItemDto ToListDto(Inventory inv) =>
        new(
            inv.Id,
            inv.Title,
            inv.Description,
            inv.ImageUrl,
            inv.IsPublic,
            inv.OwnerId,
            inv.Owner.DisplayName,
            inv.CreatedAt,
            inv.UpdatedAt,
            inv.Version,
            inv.CategoryId,
            inv.Category?.Name,
            Tags: inv.Tags.Select(t => t.TagName).OrderBy(t => t).ToList()
        );

    private static async Task<PagedResult<InventoryListItemDto>> ToPagedResult(
        IQueryable<Inventory> query, int page, int pageSize)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page     = Math.Max(1, page);

        var total      = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        var items      = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<InventoryListItemDto>(
            items.Select(ToListDto).ToList(),
            total, page, pageSize, totalPages
        );
    }
}
