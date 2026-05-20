using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface IInventoryService
{
    Task<Result<PagedResult<InventoryListItemDto>>> GetAll(int page, int pageSize, string sort = "", string? tag = null);
    Task<Result<PagedResult<InventoryListItemDto>>> GetMy(int page, int pageSize, string sort = "");
}