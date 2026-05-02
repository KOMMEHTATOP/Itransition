using InventoryApi.Data;
using InventoryApi.Models.Dto;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SearchController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public SearchController(ApplicationDbContext db) => _db = db;

    // GET /api/search?q=text
    [HttpGet]
    public async Task<ActionResult<SearchResultDto>> Search([FromQuery] string q = "")
    {
        q = q.Trim();
        if (q.Length < 2)
            return Ok(new SearchResultDto([], []));

        var tsQuery = BuildPrefixQuery(q);
        if (string.IsNullOrEmpty(tsQuery))
            return Ok(new SearchResultDto([], []));

        var inventories = await _db.Inventories
            .FromSqlInterpolated(
                $"SELECT * FROM \"Inventories\" WHERE \"SearchVector\" @@ to_tsquery('english', {tsQuery})")
            .Where(i => i.IsPublic)
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .OrderByDescending(i => i.CreatedAt)
            .Take(20)
            .AsNoTracking()
            .ToListAsync();

        var items = await _db.Items
            .FromSqlInterpolated(
                $"SELECT * FROM \"Items\" WHERE \"SearchVector\" @@ to_tsquery('english', {tsQuery})")
            .Include(i => i.Author)
            .Include(i => i.Inventory)
            .Where(i => i.Inventory.IsPublic)
            .OrderByDescending(i => i.CreatedAt)
            .Take(20)
            .AsNoTracking()
            .ToListAsync();

        var invDtos = inventories.Select(i => new InventorySearchResultDto(
            i.Id,
            i.Title,
            i.Description,
            i.Owner.DisplayName,
            i.CreatedAt,
            i.Category?.Name
        )).ToList();

        var itemDtos = items.Select(item => new ItemSearchResultDto(
            item.Id,
            item.CustomId,
            item.InventoryId,
            item.Inventory.Title,
            item.Author.DisplayName,
            item.CreatedAt
        )).ToList();

        return Ok(new SearchResultDto(invDtos, itemDtos));
    }

    // Splits "new inv" → "new:* & inv:*" for prefix matching via to_tsquery
    private static string BuildPrefixQuery(string q) =>
        string.Join(" & ", q
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(w => w.Length > 0)
            .Select(w => System.Text.RegularExpressions.Regex.Replace(w, @"[^\w]", "") + ":*")
            .Where(w => w.Length > 2));
}
