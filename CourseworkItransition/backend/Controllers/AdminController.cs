using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ApiControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }
    
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        return FromResult(await _adminService.GetUsers());
    }

    [HttpPost("users/block")]
    public async Task<IActionResult> Block([FromBody] BatchIdsRequest req)
    {
        return FromResult(await _adminService.Block(req, UserId()!));
    }

    [HttpPost("users/unblock")]
    public async Task<IActionResult> Unblock([FromBody] BatchIdsRequest req)
    {
        return FromResult(await _adminService.Unblock(req));
    }

    [HttpDelete("users")]
    public async Task<IActionResult> Delete([FromBody] BatchIdsRequest req)
    {
        return FromResult(await _adminService.Delete(req, UserId()!));
    }

    [HttpPost("users/promote")]
    public async Task<IActionResult> Promote([FromBody] BatchIdsRequest req)
    {
        return FromResult(await _adminService.Promote(req));
    }

    [HttpPost("users/demote")]
    public async Task<IActionResult> Demote([FromBody] BatchIdsRequest req)
    {
        return FromResult(await _adminService.Demote(req));
    }
}
