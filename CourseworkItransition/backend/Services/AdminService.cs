using System.Security.Claims;
using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class AdminService : IAdminService
{
    private readonly  UserManager<ApplicationUser> _userManager;
    private readonly  ApplicationDbContext _context;
    
    public AdminService(UserManager<ApplicationUser> userManager, ApplicationDbContext context)
    {
        _userManager = userManager;
        _context = context;
    }
    
    public async Task<Result<List<AdminUserDto>>> GetUsers()
    {
        var users = await _context.Users
            .OrderBy(u => u.DisplayName)
            .AsNoTracking()
            .ToListAsync();
        
        var adminIds = (await _userManager.GetUsersInRoleAsync("Admin"))
            .Select(u=>u.Id)
            .ToHashSet();
        
        var inventoryCounts = await _context.Inventories
            .GroupBy(i => i.OwnerId)
            .Select(g => new { OwnerId = g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.OwnerId, x => x.Count);

        var result = users.Select(u => new AdminUserDto(
            u.Id,
            u.DisplayName,
            u.Email ?? string.Empty,
            u.IsBlocked,
            adminIds.Contains(u.Id),
            u.CreatedAt,
            inventoryCounts.GetValueOrDefault(u.Id, 0)
        )).ToList();
        
        return Result<List<AdminUserDto>>.Success(result);
    }

    public async Task<Result> Block(BatchIdsRequest req,  string currentUserId)
    {
        var users = await _context.Users.Where(u => req.Ids.Contains(u.Id) && u.Id != currentUserId).ToListAsync();
        foreach (var u in users)
        {
            u.IsBlocked = true;
        }
        
        await _context.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> Unblock(BatchIdsRequest req)
    {
        var users = await _context.Users.Where(u => req.Ids.Contains(u.Id)).ToListAsync();
        foreach (var u in users) u.IsBlocked = false;
        await _context.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> Delete(BatchIdsRequest req, string currentUserId)
    {
        var users = await _context.Users.Where(u => req.Ids.Contains(u.Id) && u.Id != currentUserId).ToListAsync();
        if (!users.Any())
        {
            return Result.Failure(ResultStatus.NotFound, "User not found");
        }
        _context.Users.RemoveRange(users);
        await _context.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> Promote(BatchIdsRequest req)
    {
        foreach (var id in req.Ids)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return Result.Failure(ResultStatus.NotFound, "User not found");
            }

            if (!await _userManager.IsInRoleAsync(user, "Admin"))
            {
                await _userManager.AddToRoleAsync(user, "Admin");
            }
            
        }

        return Result.Success();
    }

    public async Task<Result> Demote(BatchIdsRequest req)
    {
        foreach (var id in req.Ids)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
            {
                return Result.Failure(ResultStatus.NotFound, "User not found");
            }

            if (await _userManager.IsInRoleAsync(user, "Admin"))
            {
                await _userManager.RemoveFromRoleAsync(user, "Admin");
            }
            
        }

        return Result.Success();
    }
}