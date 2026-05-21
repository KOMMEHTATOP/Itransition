using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class SearchService : ISearchService
{
    private readonly ApplicationDbContext _db;
    public SearchService(ApplicationDbContext db) => _db = db;

    public async Task<Result<SearchResultDto>> Search(string q)
    {
        q = q.Trim();
        if (q.Length < 2)
        {
            return Result<SearchResultDto>.Success(new SearchResultDto([], []));
        }

        var tsQuery = BuildPrefixQuery(q);
        if (string.IsNullOrEmpty(tsQuery))
        {
            return Result<SearchResultDto>.Success(new SearchResultDto([], []));
        }

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

        var itemIds = items.Select(i => i.Id).ToList();
        var firstFieldValues = await _db.ItemFieldValues
            .Include(fv => fv.Field)
            .Where(fv => itemIds.Contains(fv.ItemId) && fv.Value != "" &&
                         (fv.Field.Type == FieldType.Text || fv.Field.Type == FieldType.MultilineText))
            .OrderBy(fv => fv.Field.Order)
            .AsNoTracking()
            .ToListAsync();

        var nameMap = firstFieldValues
            .GroupBy(fv => fv.ItemId)
            .ToDictionary(g => g.Key, g => g.First().Value);

        var itemDtos = items.Select(item => new ItemSearchResultDto(
            item.Id,
            item.CustomId,
            nameMap.TryGetValue(item.Id, out var name) ? name : null,
            item.InventoryId,
            item.Inventory.Title,
            item.Author.DisplayName,
            item.CreatedAt
        )).ToList();

        return Result<SearchResultDto>.Success(new SearchResultDto(invDtos, itemDtos));
    }
    
    private static string BuildPrefixQuery(string q) =>
        string.Join(" & ", q
            .Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(w => w.Length > 0)
            .Select(w => System.Text.RegularExpressions.Regex.Replace(w, @"[^\w]", "") + ":*")
            .Where(w => w.Length > 2));
}