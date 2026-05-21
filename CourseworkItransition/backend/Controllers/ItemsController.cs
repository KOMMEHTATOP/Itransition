using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

public class ItemsController : ApiControllerBase
{
    private readonly IItemService _itemService;

    public ItemsController(IItemService itemService)
    {
        _itemService = itemService;
    }

    [HttpGet("api/inventories/{inventoryId:guid}/items")]
    public async Task<IActionResult> GetItems(
        Guid inventoryId, int page = 1, int pageSize = 20, string sort = "newest")
    {
        return FromResult(await _itemService.GetItems(inventoryId, UserId(), IsAdmin(), page, pageSize, sort));
    }

    [HttpPost("api/inventories/{inventoryId:guid}/items")]
    [Authorize]
    public async Task<IActionResult> CreateItem(Guid inventoryId, [FromBody] CreateItemRequest req)
    {
        var result = await _itemService.CreateItem(inventoryId, UserId()!, IsAdmin(), req);
        if (!result.IsSuccess)
        {
            return FromResult(result);
        }
        return CreatedAtAction(nameof(GetItem), new { id = result.Value!.Id }, result.Value);
    }

    [HttpGet("api/items/{id:guid}")]
    public async Task<IActionResult> GetItem(Guid id)
    {
        return FromResult(await _itemService.GetItem(id, UserId(), IsAdmin()));
    }

    [HttpPost("api/items/{id:guid}/like")]
    [Authorize]
    public async Task<IActionResult> LikeItem(Guid id)
    {
        return FromResult(await _itemService.LikeItem(id, UserId()!, IsAdmin()));
    }

    [HttpDelete("api/items/{id:guid}/like")]
    [Authorize]
    public async Task<IActionResult> UnlikeItem(Guid id)
    {
        return FromResult(await _itemService.UnlikeItem(id, UserId()!));
    }

    [HttpPut("api/items/{id:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateItem(Guid id, [FromBody] UpdateItemRequest req)
    {
        return FromResult(await _itemService.UpdateItem(id, UserId()!, IsAdmin(), req));
    }

    [HttpDelete("api/items/{id:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteItem(Guid id)
    {
        return FromResult(await _itemService.DeleteItem(id, UserId()!, IsAdmin()));
    }

    [HttpDelete("api/inventories/{inventoryId:guid}/items")]
    [Authorize]
    public async Task<IActionResult> DeleteItems(Guid inventoryId, [FromBody] List<Guid> ids)
    {
        return FromResult(await _itemService.DeleteItems(inventoryId, ids, UserId()!, IsAdmin()));
    }
}