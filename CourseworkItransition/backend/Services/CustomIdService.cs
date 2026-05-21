using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class CustomIdService : ICustomIdService
{
    private readonly ApplicationDbContext _db;
    private readonly CustomIdGeneratorService _generator;

    public CustomIdService(ApplicationDbContext db, CustomIdGeneratorService generator)
    {
        _db = db;
        _generator = generator;
    }

    public async Task<Result<List<CustomIdElementDto>>> GetElements(Guid inventoryId, string? userId, bool isAdmin)
    {
        var inv = await _db.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result<List<CustomIdElementDto>>.Failure(ResultStatus.NotFound, "Inventory not found");
        }

        if (!inv.IsPublic && !isAdmin && inv.OwnerId != userId)
        {
            return Result<List<CustomIdElementDto>>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        var elements = await _db.CustomIdElements
            .AsNoTracking()
            .Where(e => e.InventoryId == inventoryId)
            .OrderBy(e => e.Order)
            .ToListAsync();

        return Result<List<CustomIdElementDto>>.Success(elements.Select(ToDto).ToList());
    }

    public async Task<Result<CustomIdElementDto>> AddElement(Guid inventoryId, string userId, bool isAdmin, CreateCustomIdElementRequest req)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result<CustomIdElementDto>.Failure(ResultStatus.NotFound, "Inventory not found");
        }

        if (!CanModify(inv, userId, isAdmin))
        {
            return Result<CustomIdElementDto>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        if (!Enum.TryParse<CustomIdElementType>(req.Type, out var type))
        {
            return Result<CustomIdElementDto>.Failure(ResultStatus.Invalid, "Invalid element type");
        }

        var count = await _db.CustomIdElements.CountAsync(e => e.InventoryId == inventoryId);
        if (count >= 10)
        {
            return Result<CustomIdElementDto>.Failure(ResultStatus.Invalid, "Maximum 10 elements allowed");
        }

        var el = new CustomIdElement
        {
            InventoryId  = inventoryId,
            Type         = type,
            FormatString = req.FormatString,
            Order        = count,
        };

        _db.CustomIdElements.Add(el);
        await _db.SaveChangesAsync();

        return Result<CustomIdElementDto>.Success(ToDto(el));
    }

    public async Task<Result<CustomIdElementDto>> UpdateElement(Guid inventoryId, Guid elementId, string userId, bool isAdmin, UpdateCustomIdElementRequest req)
    {
        var el = await _db.CustomIdElements
            .Include(e => e.Inventory)
            .FirstOrDefaultAsync(e => e.Id == elementId && e.InventoryId == inventoryId);
        if (el is null)
        {
            return Result<CustomIdElementDto>.Failure(ResultStatus.NotFound, "Element not found");
        }

        if (!CanModify(el.Inventory, userId, isAdmin))
        {
            return Result<CustomIdElementDto>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        if (!Enum.TryParse<CustomIdElementType>(req.Type, out var type))
        {
            return Result<CustomIdElementDto>.Failure(ResultStatus.Invalid, "Invalid element type");
        }

        el.Type         = type;
        el.FormatString = req.FormatString;
        el.Order        = req.Order;

        await _db.SaveChangesAsync();
        return Result<CustomIdElementDto>.Success(ToDto(el));
    }

    public async Task<Result> DeleteElement(Guid inventoryId, Guid elementId, string userId, bool isAdmin)
    {
        var el = await _db.CustomIdElements
            .Include(e => e.Inventory)
            .FirstOrDefaultAsync(e => e.Id == elementId && e.InventoryId == inventoryId);
        if (el is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Element not found");
        }

        if (!CanModify(el.Inventory, userId, isAdmin))
        {
            return Result.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        _db.CustomIdElements.Remove(el);
        await _db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> Reorder(Guid inventoryId, string userId, bool isAdmin, List<Guid> orderedIds)
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

        var elements = await _db.CustomIdElements
            .Where(e => e.InventoryId == inventoryId)
            .ToListAsync();

        for (var i = 0; i < orderedIds.Count; i++)
        {
            var el = elements.FirstOrDefault(e => e.Id == orderedIds[i]);
            if (el is not null)
            {
                el.Order = i;
            }
        }

        await _db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result<string>> Preview(Guid inventoryId, string userId, bool isAdmin)
    {
        var inv = await _db.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result<string>.Failure(ResultStatus.NotFound, "Inventory not found");
        }

        if (!CanModify(inv, userId, isAdmin))
        {
            return Result<string>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        var preview = await _generator.GenerateAsync(inventoryId);
        return Result<string>.Success(preview);
    }

    private static bool CanModify(Inventory inv, string userId, bool isAdmin) =>
        isAdmin || inv.OwnerId == userId;

    private static CustomIdElementDto ToDto(CustomIdElement el) =>
        new(el.Id, el.Type.ToString(), el.FormatString, el.Order);
}