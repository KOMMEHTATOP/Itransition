using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface IAuthService
{
    Task<Result<AuthResponse>> Register(RegisterRequest req);
    Task<Result<AuthResponse>> Login(LoginRequest req);
    Task<Result<UserDto>> Me(string userId);
}