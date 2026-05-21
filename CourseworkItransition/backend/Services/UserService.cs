using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class UserService : IUserService
{
    private readonly ApplicationDbContext _db;
    public UserService(ApplicationDbContext db) => _db = db;
    
    public async Task<Result<UserPublicProfileDto>> GetProfile(string id)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id);
        if (user is null || user.IsBlocked)
        {
            return Result<UserPublicProfileDto>.Failure(ResultStatus.NotFound, "User not found");
        }

        var inventories = await _db.Inventories
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .Where(i => i.OwnerId == id && i.IsPublic)
            .OrderByDescending(i => i.CreatedAt)
            .Take(50)
            .AsNoTracking()
            .Select(i => new InventoryListItemDto(
                i.Id, i.Title, i.Description ?? string.Empty, i.ImageUrl,
                i.IsPublic, i.OwnerId, user.DisplayName, i.CreatedAt, i.UpdatedAt,
                i.Version, i.CategoryId, i.Category != null ? i.Category.Name : null,
                i.Tags.Select(t => t.TagName).ToList()))
            .ToListAsync();
        
        return Result<UserPublicProfileDto>.Success(new UserPublicProfileDto(user.Id, user.DisplayName, inventories));
    }

    public async Task<Result<List<UserSearchResultDto>>> Search(string q, int limit)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return Result<List<UserSearchResultDto>>.Success(new List<UserSearchResultDto>());
        }

        limit = Math.Clamp(limit, 1, 50);
        var lower = q.Trim().ToLowerInvariant();

        var users = await _db.Users
            .Where(u => !u.IsBlocked &&
                        (u.DisplayName.ToLower().Contains(lower) ||
                         (u.Email != null && u.Email.ToLower().Contains(lower))))
            .OrderBy(u => u.DisplayName)
            .Take(limit)
            .AsNoTracking()
            .ToListAsync();

        return Result<List<UserSearchResultDto>>.Success(
            users.Select(u => new UserSearchResultDto(u.Id, u.DisplayName, u.Email ?? string.Empty))
                .ToList());
    }
}