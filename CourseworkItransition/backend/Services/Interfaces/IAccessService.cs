using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface IAccessService
{
    Task<Result<List<AccessUserDto>>> GetAccess(Guid inventoryId, string currentUserId, bool isAdmin);
    Task<Result> GrantAccess(Guid inventoryId, string userId, string currentUserId, bool isAdmin);
    Task<Result> RevokeAccess(Guid inventoryId, List<string> userIds, string currentUserId, bool isAdmin);
}