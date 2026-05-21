using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface IAdminService
{
    Task<Result<List<AdminUserDto>>> GetUsers();
    Task<Result> Block(BatchIdsRequest req, string currentUserId);
    Task<Result> Unblock(BatchIdsRequest req);
    Task<Result> Delete(BatchIdsRequest req, string currentUserId);
    Task<Result> Promote(BatchIdsRequest req);
    Task<Result> Demote(BatchIdsRequest req);
}