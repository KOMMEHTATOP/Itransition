using InventoryApi.Common;
using InventoryApi.Models.Dto.Support;

namespace InventoryApi.Services.Interfaces;

public interface ISupportTicketService
{
    Task<Result<SupportTicketResultDto>> CreateTicketAsync(
        string userId,
        SupportTicketRequest request);
}
