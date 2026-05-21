using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface IUserService
{
    Task<Result<UserPublicProfileDto>> GetProfile(string id);
    Task<Result<List<UserSearchResultDto>>> Search(string q, int limit);
}