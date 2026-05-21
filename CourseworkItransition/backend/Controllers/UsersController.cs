using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/users")]
public class UsersController : ApiControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("{id}/profile")]
    [AllowAnonymous]
    public async Task<IActionResult> GetProfile(string id)
    {
        return FromResult(await _userService.GetProfile(id));
    }

    [HttpGet("search")]
    [Authorize]
    public async Task<IActionResult> Search(string q = "", int limit = 10)
    {
        return FromResult(await _userService.Search(q, limit));
    }
}