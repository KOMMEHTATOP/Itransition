using InventoryApi.Common;
using InventoryApi.Models.Dto.External;

namespace InventoryApi.Services.Interfaces;

public interface IExternalInventoryService
{
    Task<Result<InventoryAggregateDto>> GetAggregateByTokenAsync(string token);

    Task<Result<ExternalCreateItemsResultDto>> CreateItemsByTokenAsync(
        string token,
        ExternalCreateItemsRequest request);
}
