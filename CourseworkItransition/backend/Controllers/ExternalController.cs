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
}
