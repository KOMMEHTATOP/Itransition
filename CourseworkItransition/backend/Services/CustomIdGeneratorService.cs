using InventoryApi.Data;
using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class CustomIdGeneratorService
{
    private readonly ApplicationDbContext _db;

    public CustomIdGeneratorService(ApplicationDbContext db) => _db = db;

    public async Task<string> GenerateAsync(Guid inventoryId)
    {
        var elements = await _db.CustomIdElements
            .Where(e => e.InventoryId == inventoryId)
            .OrderBy(e => e.Order)
            .ToListAsync();

        if (elements.Count == 0) return string.Empty;

        var parts = new List<string>(elements.Count);
        foreach (var el in elements)
            parts.Add(await BuildPart(el, inventoryId));

        return string.Concat(parts);
    }

    private async Task<string> BuildPart(CustomIdElement el, Guid inventoryId)
    {
        var fmt = el.FormatString;
        return el.Type switch
        {
            CustomIdElementType.Fixed        => fmt,
            CustomIdElementType.Random20bit  => Random.Shared.Next(0, 1_048_576)
                                                    .ToString(string.IsNullOrEmpty(fmt) ? "X5" : fmt),
            CustomIdElementType.Random32bit  => Random.Shared.Next(0, int.MaxValue)
                                                    .ToString(string.IsNullOrEmpty(fmt) ? "X8" : fmt),
            CustomIdElementType.Random6digit => Random.Shared.Next(0, 1_000_000).ToString("D6"),
            CustomIdElementType.Random9digit => Random.Shared.Next(0, 1_000_000_000).ToString("D9"),
            CustomIdElementType.GUID         => Guid.NewGuid().ToString(),
            CustomIdElementType.DateTime     => DateTime.UtcNow
                                                    .ToString(string.IsNullOrEmpty(fmt) ? "yyyyMMdd" : fmt),
            CustomIdElementType.Sequence     => await NextSequenceAsync(inventoryId, fmt),
            _                                => string.Empty,
        };
    }

    private async Task<string> NextSequenceAsync(Guid inventoryId, string fmt)
    {
        var inv = await _db.Inventories.FirstAsync(i => i.Id == inventoryId);
        inv.SequenceCounter += 1;
        return inv.SequenceCounter.ToString(string.IsNullOrEmpty(fmt) ? "D3" : fmt);
    }
}
