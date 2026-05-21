using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/inventories/{inventoryId:guid}/fields")]
public class InventoryFieldsController : ApiControllerBase
{
    private readonly IInventoryFieldService _fieldService;

    public InventoryFieldsController(IInventoryFieldService fieldService)
    {
        _fieldService = fieldService;
    }

    [HttpGet]
    public async Task<IActionResult> GetFields(Guid inventoryId)
    {
        return FromResult(await _fieldService.GetFields(inventoryId, UserId(), IsAdmin()));
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateField(Guid inventoryId, [FromBody] CreateFieldRequest req)
    {
        var result = await _fieldService.CreateField(inventoryId, UserId()!, IsAdmin(), req);
        if (!result.IsSuccess)
        {
            return FromResult(result);
        }
        return CreatedAtAction(nameof(GetFields), new { inventoryId }, result.Value);
    }

    [HttpPut("{fieldId:guid}")]
    [Authorize]
    public async Task<IActionResult> UpdateField(Guid inventoryId, Guid fieldId, [FromBody] UpdateFieldRequest req)
    {
        return FromResult(await _fieldService.UpdateField(inventoryId, fieldId, UserId()!, IsAdmin(), req));
    }

    [HttpDelete("{fieldId:guid}")]
    [Authorize]
    public async Task<IActionResult> DeleteField(Guid inventoryId, Guid fieldId)
    {
        return FromResult(await _fieldService.DeleteField(inventoryId, fieldId, UserId()!, IsAdmin()));
    }

    [HttpPut("reorder")]
    [Authorize]
    public async Task<IActionResult> ReorderFields(Guid inventoryId, [FromBody] List<Guid> orderedIds)
    {
        return FromResult(await _fieldService.ReorderFields(inventoryId, UserId()!, IsAdmin(), orderedIds));
    }
}