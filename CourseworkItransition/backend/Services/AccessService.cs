using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class AccessService : IAccessService
{
    private readonly ApplicationDbContext _db;
    public AccessService(ApplicationDbContext db) => _db = db;

    public async Task<Result<List<AccessUserDto>>> GetAccess(Guid inventoryId, string currentUserId, bool isAdmin)
    {
        var inv = await _db.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result<List<AccessUserDto>>.Failure(ResultStatus.NotFound, "Inventory not found");
        }

        if (!CanManage(inv, currentUserId, isAdmin))
        {
            return Result<List<AccessUserDto>>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        var grants = await _db.InventoryAccess
            .Where(a => a.InventoryId == inventoryId)
            .Include(a => a.User)
            .AsNoTracking()
            .ToListAsync();

        return Result<List<AccessUserDto>>.Success(
            grants.Select(a => new AccessUserDto(a.User.Id, a.User.DisplayName, a.User.Email ?? string.Empty))
                  .ToList());
    }

    public async Task<Result> GrantAccess(Guid inventoryId, string userId, string currentUserId, bool isAdmin)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Inventory not found");
        }

        if (!CanManage(inv, currentUserId, isAdmin))
        {
            return Result.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        if (inv.OwnerId == userId)
        {
            return Result.Failure(ResultStatus.Invalid, "Cannot grant access to the inventory owner");
        }

        var userExists = await _db.Users.AnyAsync(u => u.Id == userId);
        if (!userExists)
        {
            return Result.Failure(ResultStatus.NotFound, "User not found");
        }

        var already = await _db.InventoryAccess.AnyAsync(a => a.InventoryId == inventoryId && a.UserId == userId);
        if (already)
        {
            return Result.Failure(ResultStatus.Conflict, "User already has access");
        }

        _db.InventoryAccess.Add(new InventoryAccess { InventoryId = inventoryId, UserId = userId });
        await _db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> RevokeAccess(Guid inventoryId, List<string> userIds, string currentUserId, bool isAdmin)
    {
        if (userIds.Count == 0)
        {
            return Result.Failure(ResultStatus.Invalid, "No user ids provided");
        }

        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Inventory not found");
        }

        if (!CanManage(inv, currentUserId, isAdmin))
        {
            return Result.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        var grants = await _db.InventoryAccess
            .Where(a => a.InventoryId == inventoryId && userIds.Contains(a.UserId))
            .ToListAsync();

        _db.InventoryAccess.RemoveRange(grants);
        await _db.SaveChangesAsync();
        return Result.Success();
    }

    private static bool CanManage(Inventory inv, string currentUserId, bool isAdmin) =>
        isAdmin || inv.OwnerId == currentUserId;
}