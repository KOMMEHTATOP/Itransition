using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/search")]
public class SearchController : ApiControllerBase
{
    private readonly ISearchService _searchService;

    public SearchController(ISearchService searchService)
    {
        _searchService = searchService;
    }

    [HttpGet]
    public async Task<IActionResult> Search([FromQuery] string q = "")
    {
        return FromResult(await _searchService.Search(q));
    }
}