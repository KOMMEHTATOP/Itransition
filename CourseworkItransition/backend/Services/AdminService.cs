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

    public async Task<Result> Block(BatchIdsRequest req)
    {
        throw new NotImplementedException();
    }

    public async Task<Result> Unblock(BatchIdsRequest req)
    {
        throw new NotImplementedException();
    }

    public async Task<Result> Delete(BatchIdsRequest req)
    {
        throw new NotImplementedException();
    }

    public async Task<Result> Promote(BatchIdsRequest req)
    {
        throw new NotImplementedException();
    }

    public async Task<Result> Demote(BatchIdsRequest req)
    {
        throw new NotImplementedException();
    }
}