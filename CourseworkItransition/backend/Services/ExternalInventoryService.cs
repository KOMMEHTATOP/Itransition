using System.Globalization;
using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto.External;
using InventoryApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class ExternalInventoryService : IExternalInventoryService
{
    private const int PopularValuesLimit = 5;

    private readonly ApplicationDbContext _context;

    public ExternalInventoryService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Result<InventoryAggregateDto>> GetAggregateByTokenAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return Result<InventoryAggregateDto>.Failure(ResultStatus.NotFound, "Invalid token");

        var inventory = await _context.Inventories
            .AsNoTracking()
            .Include(i => i.Fields)
            .FirstOrDefaultAsync(i => i.ApiToken == token);

        if (inventory is null)
            return Result<InventoryAggregateDto>.Failure(ResultStatus.NotFound, "Invalid token");

        var itemCount = await _context.Items
            .CountAsync(it => it.InventoryId == inventory.Id);

        var rawValues = await _context.ItemFieldValues
            .AsNoTracking()
            .Where(fv => fv.Item.InventoryId == inventory.Id)
            .Select(fv => new { fv.FieldId, fv.Value })
            .ToListAsync();

        var valuesByField = rawValues
            .GroupBy(v => v.FieldId)
            .ToDictionary(g => g.Key, g => g.Select(x => x.Value).ToList());

        var fields = inventory.Fields
            .OrderBy(f => f.Order)
            .Select(f => BuildFieldAggregate(f, valuesByField.GetValueOrDefault(f.Id, [])))
            .ToList();

        return Result<InventoryAggregateDto>.Success(
            new InventoryAggregateDto(inventory.Title, itemCount, fields));
    }

    private static FieldAggregateDto BuildFieldAggregate(InventoryField field, List<string> values)
    {
        var typeName = field.Type.ToString();

        switch (field.Type)
        {
            case FieldType.Number:
            {
                var numbers = values
                    .Select(v => double.TryParse(v, NumberStyles.Any, CultureInfo.InvariantCulture, out var n)
                        ? (double?)n
                        : null)
                    .Where(n => n.HasValue)
                    .Select(n => n!.Value)
                    .ToList();

                var numeric = numbers.Count > 0
                    ? new NumericAggregateDto(
                        Math.Round(numbers.Average(), 2),
                        numbers.Min(),
                        numbers.Max())
                    : null;

                return new FieldAggregateDto(field.Title, typeName, numeric, null, null);
            }

            case FieldType.Boolean:
            {
                var trueCount  = values.Count(v => v == "true");
                var falseCount = values.Count(v => v == "false");
                return new FieldAggregateDto(field.Title, typeName, null, null,
                    new BooleanAggregateDto(trueCount, falseCount));
            }

            default: // Text, MultilineText, Link
            {
                var popular = values
                    .Where(v => !string.IsNullOrWhiteSpace(v))
                    .GroupBy(v => v)
                    .Select(g => new PopularValueDto(g.Key, g.Count()))
                    .OrderByDescending(p => p.Count)
                    .Take(PopularValuesLimit)
                    .ToList();

                return new FieldAggregateDto(field.Title, typeName, null, popular, null);
            }
        }
    }
}
