using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/inventories/{inventoryId:guid}/comments")]
public class CommentsController : ApiControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(Guid inventoryId)
    {
        return FromResult(await _commentService.GetAll(inventoryId, UserId(), IsAdmin()));
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> Create(Guid inventoryId, [FromBody] CreateCommentRequest req)
    {
        var result = await _commentService.Create(inventoryId, UserId()!, IsAdmin(), req);
        if (!result.IsSuccess)
        {
            return FromResult(result);
        }
        return CreatedAtAction(nameof(GetAll), new { inventoryId }, result.Value);
    }
}