using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class InventoryFieldService : IInventoryFieldService
{
    private readonly ApplicationDbContext _db;
    public InventoryFieldService(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<InventoryFieldDto>>> GetFields(Guid inventoryId, string? userId, bool isAdmin)
    {
        var inv = await _db.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result<List<InventoryFieldDto>>.Failure(ResultStatus.NotFound, "Inventory not found");
        }

        if (!inv.IsPublic && !isAdmin && inv.OwnerId != userId)
        {
            return Result<List<InventoryFieldDto>>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        var fields = await _db.InventoryFields
            .AsNoTracking()
            .Where(f => f.InventoryId == inventoryId)
            .OrderBy(f => f.Order)
            .Select(f => new InventoryFieldDto(f.Id, f.Title, f.Description, f.Type.ToString(), f.Order, f.ShowInTable))
            .ToListAsync();

        return Result<List<InventoryFieldDto>>.Success(fields);
    }

    public async Task<Result<InventoryFieldDto>> CreateField(Guid inventoryId, string userId, bool isAdmin, CreateFieldRequest req)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result<InventoryFieldDto>.Failure(ResultStatus.NotFound, "Inventory not found");
        }

        if (!CanModify(inv, userId, isAdmin))
        {
            return Result<InventoryFieldDto>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        if (string.IsNullOrWhiteSpace(req.Title))
        {
            return Result<InventoryFieldDto>.Failure(ResultStatus.Invalid, "Title is required");
        }

        if (!Enum.TryParse<FieldType>(req.Type, out var fieldType))
        {
            return Result<InventoryFieldDto>.Failure(ResultStatus.Invalid, $"Invalid field type: {req.Type}");
        }

        var typeCount = await _db.InventoryFields
            .CountAsync(f => f.InventoryId == inventoryId && f.Type == fieldType);
        if (typeCount >= 3)
        {
            return Result<InventoryFieldDto>.Failure(ResultStatus.Invalid, $"Maximum 3 fields of type '{req.Type}' allowed per inventory");
        }

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

        return Result<InventoryFieldDto>.Success(
            new InventoryFieldDto(field.Id, field.Title, field.Description, field.Type.ToString(), field.Order, field.ShowInTable));
    }

    public async Task<Result<InventoryFieldDto>> UpdateField(Guid inventoryId, Guid fieldId, string userId, bool isAdmin, UpdateFieldRequest req)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result<InventoryFieldDto>.Failure(ResultStatus.NotFound, "Inventory not found");
        }

        if (!CanModify(inv, userId, isAdmin))
        {
            return Result<InventoryFieldDto>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        var field = await _db.InventoryFields
            .FirstOrDefaultAsync(f => f.Id == fieldId && f.InventoryId == inventoryId);
        if (field is null)
        {
            return Result<InventoryFieldDto>.Failure(ResultStatus.NotFound, "Field not found");
        }

        if (string.IsNullOrWhiteSpace(req.Title))
        {
            return Result<InventoryFieldDto>.Failure(ResultStatus.Invalid, "Title is required");
        }

        field.Title       = req.Title.Trim();
        field.Description = req.Description?.Trim() ?? string.Empty;
        field.ShowInTable = req.ShowInTable;
        field.Order       = req.Order;

        await _db.SaveChangesAsync();

        return Result<InventoryFieldDto>.Success(
            new InventoryFieldDto(field.Id, field.Title, field.Description, field.Type.ToString(), field.Order, field.ShowInTable));
    }

    public async Task<Result> DeleteField(Guid inventoryId, Guid fieldId, string userId, bool isAdmin)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Inventory not found");
        }

        if (!CanModify(inv, userId, isAdmin))
        {
            return Result.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        var field = await _db.InventoryFields
            .FirstOrDefaultAsync(f => f.Id == fieldId && f.InventoryId == inventoryId);
        if (field is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Field not found");
        }

        _db.InventoryFields.Remove(field);
        await _db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> ReorderFields(Guid inventoryId, string userId, bool isAdmin, List<Guid> orderedIds)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Inventory not found");
        }

        if (!CanModify(inv, userId, isAdmin))
        {
            return Result.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        var fields = await _db.InventoryFields
            .Where(f => f.InventoryId == inventoryId)
            .ToListAsync();

        for (var i = 0; i < orderedIds.Count; i++)
        {
            var f = fields.FirstOrDefault(x => x.Id == orderedIds[i]);
            if (f is not null)
            {
                f.Order = i;
            }
        }

        await _db.SaveChangesAsync();
        return Result.Success();
    }

    private static bool CanModify(Inventory inv, string userId, bool isAdmin) =>
        isAdmin || inv.OwnerId == userId;
}