using InventoryApi.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/tags")]
public class TagsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public TagsController(ApplicationDbContext db) => _db = db;

    // GET /api/tags?q=book — autocomplete suggestions
    [HttpGet]
    public async Task<ActionResult<List<string>>> Search(string q = "", int limit = 10)
    {
        limit = Math.Clamp(limit, 1, 50);

        if (string.IsNullOrWhiteSpace(q))
        {
            var popular = await _db.InventoryTags
                .GroupBy(t => t.TagName)
                .OrderByDescending(g => g.Count())
                .Take(limit)
                .Select(g => g.Key)
                .ToListAsync();
            return popular;
        }

        var lower = q.Trim().ToLowerInvariant();
        var tags = await _db.InventoryTags
            .Where(t => t.TagName.StartsWith(lower))
            .Select(t => t.TagName)
            .Distinct()
            .OrderBy(t => t)
            .Take(limit)
            .ToListAsync();

        return tags;
    }
}
