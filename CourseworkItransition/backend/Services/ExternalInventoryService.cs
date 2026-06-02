using System.Globalization;
using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Models.Dto.External;
using InventoryApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class ExternalInventoryService : IExternalInventoryService
{
    private const int PopularValuesLimit = 5;

    private readonly ApplicationDbContext _context;
    private readonly IItemService _itemService;

    public ExternalInventoryService(ApplicationDbContext context, IItemService itemService)
    {
        _context = context;
        _itemService = itemService;
    }

    public async Task<Result<ExternalCreateItemsResultDto>> CreateItemsByTokenAsync(
        string token,
        ExternalCreateItemsRequest request)
    {
        if (string.IsNullOrWhiteSpace(token))
            return Result<ExternalCreateItemsResultDto>.Failure(ResultStatus.NotFound, "Invalid token");

        var inventory = await _context.Inventories
            .AsNoTracking()
            .Include(i => i.Fields)
            .FirstOrDefaultAsync(i => i.ApiToken == token);

        if (inventory is null)
            return Result<ExternalCreateItemsResultDto>.Failure(ResultStatus.NotFound, "Invalid token");

        if (request.Items is null || request.Items.Count == 0)
            return Result<ExternalCreateItemsResultDto>.Failure(ResultStatus.Invalid, "No items provided");

        var fieldIdByTitle = inventory.Fields
            .GroupBy(f => f.Title)
            .ToDictionary(g => g.Key, g => g.First().Id);

        var created = 0;
        var results = new List<ExternalItemResultDto>();

        foreach (var input in request.Items)
        {
            var fieldValues = new List<ItemFieldValueRequest>();
            if (input.Fields is not null)
            {
                foreach (var (title, value) in input.Fields)
                {
                    if (fieldIdByTitle.TryGetValue(title, out var fieldId))
                        fieldValues.Add(new ItemFieldValueRequest(fieldId, value));
                }
            }

            var createRequest = new CreateItemRequest(input.CustomId ?? string.Empty, fieldValues);
            var result = await _itemService.CreateItem(inventory.Id, inventory.OwnerId, false, createRequest);

            if (result.IsSuccess)
            {
                created++;
                results.Add(new ExternalItemResultDto(true, result.Value!.CustomId, null));
            }
            else
            {
                results.Add(new ExternalItemResultDto(false, null, result.Error ?? "Failed to create item"));
            }
        }

        return Result<ExternalCreateItemsResultDto>.Success(
            new ExternalCreateItemsResultDto(created, results));
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
