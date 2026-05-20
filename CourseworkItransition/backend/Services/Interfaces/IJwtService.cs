using InventoryApi.Models;

namespace InventoryApi.Services.Interfaces;

public interface IJwtService
{
    Task<string> GenerateTokenAsync(ApplicationUser user);
}