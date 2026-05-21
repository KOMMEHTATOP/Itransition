using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/inventories/{inventoryId:guid}/access")]
[Authorize]
public class AccessController : ApiControllerBase
{
    private readonly IAccessService _accessService;

    public AccessController(IAccessService accessService)
    {
        _accessService = accessService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAccess(Guid inventoryId)
    {
        return FromResult(await _accessService.GetAccess(inventoryId, UserId()!, IsAdmin()));
    }

    [HttpPost("{userId}")]
    public async Task<IActionResult> GrantAccess(Guid inventoryId, string userId)
    {
        return FromResult(await _accessService.GrantAccess(inventoryId, userId, UserId()!, IsAdmin()));
    }

    [HttpDelete]
    public async Task<IActionResult> RevokeAccess(Guid inventoryId, [FromBody] List<string> userIds)
    {
        return FromResult(await _accessService.RevokeAccess(inventoryId, userIds, UserId()!, IsAdmin()));
    }
}