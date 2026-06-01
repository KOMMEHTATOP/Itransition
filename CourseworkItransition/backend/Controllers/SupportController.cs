using InventoryApi.Models.Dto.Support;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/support")]
[Authorize]
public class SupportController : ApiControllerBase
{
    private readonly ISupportTicketService _supportTicketService;

    public SupportController(ISupportTicketService supportTicketService)
    {
        _supportTicketService = supportTicketService;
    }

    [HttpPost("tickets")]
    public async Task<IActionResult> Create([FromBody] SupportTicketRequest request)
    {
        return FromResult(await _supportTicketService.CreateTicketAsync(UserId()!, request));
    }
}
