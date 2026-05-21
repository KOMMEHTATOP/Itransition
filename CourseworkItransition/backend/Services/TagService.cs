using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class TagService : ITagService
{
    private readonly ApplicationDbContext _db;
    public TagService(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<string>>> Search(string q, int limit)
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
            return Result<List<string>>.Success(popular);
        }

        var lower = q.Trim().ToLowerInvariant();
        var tags = await _db.InventoryTags
            .Where(t => t.TagName.StartsWith(lower))
            .Select(t => t.TagName)
            .Distinct()
            .OrderBy(t => t)
            .Take(limit)
            .ToListAsync();

        return Result<List<string>>.Success(tags);
    }

    public async Task<Result<List<TagCloudItemDto>>> Cloud(int limit)
    {
        limit = Math.Clamp(limit, 1, 200);

        var cloud = await _db.InventoryTags
            .GroupBy(t => t.TagName)
            .OrderByDescending(g => g.Count())
            .Take(limit)
            .Select(g => new TagCloudItemDto(g.Key, g.Count()))
            .ToListAsync();

        return Result<List<TagCloudItemDto>>.Success(cloud);
    }
}