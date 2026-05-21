using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface IInventoryService
{
    Task<Result<PagedResult<InventoryListItemDto>>> GetAll(int page, int pageSize, string sort = "", string? tag = null);
    Task<Result<PagedResult<InventoryListItemDto>>> GetMy(string userId, int page, int pageSize, string sort = "");
    Task<Result<PagedResult<InventoryListItemDto>>> GetAccessible(string userId, bool isAdmin, int page, int pageSize, string sort);
    Task<Result<InventoryDetailDto>> GetById(Guid id, string? userId, bool isAdmin);
    Task<Result<List<TopInventoryDto>>> GetTop(int limit);
    Task<Result<List<CategoryDto>>> GetCategories();
    Task<Result<InventoryDetailDto>> Create(string userId, CreateInventoryRequest req);
    Task<Result<InventoryDetailDto>> Update(Guid id, string userId, bool isAdmin, UpdateInventoryRequest req);
    Task<Result> Delete(Guid id, string userId, bool isAdmin);
    Task<Result> DeleteBatch(List<Guid> ids, string userId, bool isAdmin);
    Task<Result<InventoryStatsDto>> GetStats(Guid id, string? userId, bool isAdmin);
    
}