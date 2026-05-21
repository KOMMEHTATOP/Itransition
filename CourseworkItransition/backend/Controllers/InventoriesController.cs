using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/inventories")]
public class InventoriesController : ApiControllerBase
{
    private readonly IInventoryService _inventoryService;

    public InventoriesController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(int page = 1, int pageSize = 20, string sort = "newest", string? tag = null)
    {
        return FromResult(await _inventoryService.GetAll(IsAdmin(), page, pageSize, sort, tag));
    }

    [HttpGet("my")]
    [Authorize]
    public async Task<IActionResult> GetMy(int page = 1, int pageSize = 20, string sort = "newest")
    {
        return FromResult(await _inventoryService.GetMy(UserId()!, page, pageSize, sort));
    }

    [HttpGet("accessible")]
    [Authorize]
    public async Task<IActionResult> GetAccessible(int page = 1, int pageSize = 20, string sort = "newest")
    {
        return FromResult(await _inventoryService.GetAccessible(UserId()!, IsAdmin(), page, pageSize, sort));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id)
    {
        return FromResult(await _inventoryService.GetById(id, UserId(), IsAdmin()));
    }

    [HttpGet("top")]
    public async Task<IActionResult> GetTop(int limit = 5)
    {
        return FromResult(await _inventoryService.GetTop(limit));
    }

    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        return FromResult(await _inventoryService.GetCategories());
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create([FromBody] CreateInventoryRequest req)
    {
        var result = await _inventoryService.Create(UserId()!, req);
        if (!result.IsSuccess)
        {
            return FromResult(result);
        }
        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateInventoryRequest req)
    {
        return FromResult(await _inventoryService.Update(id, UserId()!, IsAdmin(), req));
    }

    [HttpDelete("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> Delete(Guid id)
    {
        return FromResult(await _inventoryService.Delete(id, UserId()!, IsAdmin()));
    }

    [HttpDelete]
    [Authorize]
    public async Task<IActionResult> DeleteBatch([FromBody] List<Guid> ids)
    {
        return FromResult(await _inventoryService.DeleteBatch(ids, UserId()!, IsAdmin()));
    }

    [HttpGet("{id:guid}/stats")]
    public async Task<IActionResult> GetStats(Guid id)
    {
        return FromResult(await _inventoryService.GetStats(id, UserId(), IsAdmin()));
    }
}