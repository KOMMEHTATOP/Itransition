using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface ICustomIdService
{
    Task<Result<List<CustomIdElementDto>>> GetElements(Guid inventoryId, string? userId, bool isAdmin);
    Task<Result<CustomIdElementDto>> AddElement(Guid inventoryId, string userId, bool isAdmin, CreateCustomIdElementRequest req);
    Task<Result<CustomIdElementDto>> UpdateElement(Guid inventoryId, Guid elementId, string userId, bool isAdmin, UpdateCustomIdElementRequest req);
    Task<Result> DeleteElement(Guid inventoryId, Guid elementId, string userId, bool isAdmin);
    Task<Result> Reorder(Guid inventoryId, string userId, bool isAdmin, List<Guid> orderedIds);
    Task<Result<string>> Preview(Guid inventoryId, string userId, bool isAdmin);
}