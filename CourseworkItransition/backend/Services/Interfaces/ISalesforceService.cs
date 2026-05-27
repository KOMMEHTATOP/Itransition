using InventoryApi.Common;
using InventoryApi.Models.Dto.Salesforce;

namespace InventoryApi.Services.Interfaces;

public interface ISalesforceService
{
    Task<Result<SalesforcePushResultDto>> PushContactAsync(
        string userId,
        SalesforcePushRequest request);
}
