using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/inventories/{inventoryId:guid}/customid")]
public class CustomIdController : ApiControllerBase
{
    private readonly ICustomIdService _customIdService;

    public CustomIdController(ICustomIdService customIdService)
    {
        _customIdService = customIdService;
    }

    [HttpGet]
    public async Task<IActionResult> GetElements(Guid inventoryId)
    {
        return FromResult(await _customIdService.GetElements(inventoryId, UserId(), IsAdmin()));
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> AddElement(Guid inventoryId, [FromBody] CreateCustomIdElementRequest req)
    {
        var result = await _customIdService.AddElement(inventoryId, UserId()!, IsAdmin(), req);
        if (!result.IsSuccess)
        {
            return FromResult(result);
        }
        return CreatedAtAction(nameof(GetElements), new { inventoryId }, result.Value);
    }

    [HttpPut("{elementId:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateElement(Guid inventoryId, Guid elementId, [FromBody] UpdateCustomIdElementRequest req)
    {
        return FromResult(await _customIdService.UpdateElement(inventoryId, elementId, UserId()!, IsAdmin(), req));
    }

    [HttpDelete("{elementId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteElement(Guid inventoryId, Guid elementId)
    {
        return FromResult(await _customIdService.DeleteElement(inventoryId, elementId, UserId()!, IsAdmin()));
    }

    [HttpPut("reorder")]
    [Authorize]
    public async Task<IActionResult> Reorder(Guid inventoryId, [FromBody] List<Guid> orderedIds)
    {
        return FromResult(await _customIdService.Reorder(inventoryId, UserId()!, IsAdmin(), orderedIds));
    }

    [HttpGet("preview")]
    [Authorize]
    public async Task<IActionResult> Preview(Guid inventoryId)
    {
        return FromResult(await _customIdService.Preview(inventoryId, UserId()!, IsAdmin()));
    }
}