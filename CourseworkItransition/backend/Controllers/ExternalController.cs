using InventoryApi.Models.Dto.External;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/external")]
public class ExternalController : ApiControllerBase
{
    private readonly IExternalInventoryService _externalInventoryService;

    public ExternalController(IExternalInventoryService externalInventoryService)
    {
        _externalInventoryService = externalInventoryService;
    }

    [HttpGet("inventory")]
    public async Task<IActionResult> GetInventory([FromQuery] string token)
    {
        return FromResult(await _externalInventoryService.GetAggregateByTokenAsync(token));
    }

    [HttpPost("inventory/items")]
    public async Task<IActionResult> CreateItems(
        [FromQuery] string token,
        [FromBody] ExternalCreateItemsRequest request)
    {
        return FromResult(await _externalInventoryService.CreateItemsByTokenAsync(token, request));
    }
}
