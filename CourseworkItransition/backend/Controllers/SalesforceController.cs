using InventoryApi.Models.Dto.Salesforce;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/salesforce")]
[Authorize]
public class SalesforceController : ApiControllerBase
{
    private readonly ISalesforceService _salesforceService;

    public SalesforceController(ISalesforceService salesforceService)
    {
        _salesforceService = salesforceService;
    }

    [HttpPost("push")]
    public async Task<IActionResult> Push([FromBody] SalesforcePushRequest request)
    {
        return FromResult(await _salesforceService.PushContactAsync(UserId()!, request));
    }
}
