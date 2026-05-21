using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/tags")]
public class TagsController : ApiControllerBase
{
    private readonly ITagService _tagService;

    public TagsController(ITagService tagService)
    {
        _tagService = tagService;
    }

    [HttpGet]
    public async Task<IActionResult> Search(string q = "", int limit = 10)
    {
        return FromResult(await _tagService.Search(q, limit));
    }

    [HttpGet("cloud")]
    public async Task<IActionResult> Cloud(int limit = 50)
    {
        return FromResult(await _tagService.Cloud(limit));
    }
}