using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface IItemService
{
    Task<Result<ItemsPageDto>> GetItems(Guid inventoryId, string? userId, bool isAdmin, int page, int pageSize, string sort);
    Task<Result<ItemDetailDto>> CreateItem(Guid inventoryId, string userId, bool isAdmin, CreateItemRequest req);
    Task<Result<ItemDetailDto>> GetItem(Guid id, string? userId, bool isAdmin);
    Task<Result> LikeItem(Guid id, string userId, bool isAdmin);
    Task<Result> UnlikeItem(Guid id, string userId);
    Task<Result<ItemDetailDto>> UpdateItem(Guid id, string userId, bool isAdmin, UpdateItemRequest req);
    Task<Result> DeleteItem(Guid id, string userId, bool isAdmin);
    Task<Result> DeleteItems(Guid inventoryId, List<Guid> ids, string userId, bool isAdmin);
}