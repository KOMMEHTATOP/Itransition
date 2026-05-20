using System.Security.Claims;
using InventoryApi.Common;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ApiControllerBase : ControllerBase
    {
        protected string? UserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier);
        }
        
        protected bool IsAdmin()
        {
            return User.IsInRole("Admin");
        }

        protected IActionResult FromResult<T>(Result<T> result)
        {
            return result.Status switch
            {
                ResultStatus.Ok => Ok(result.Value),
                ResultStatus.NotFound => NotFound(result.Error),
                ResultStatus.Unauthorized => Unauthorized(result.Error),
                ResultStatus.Forbidden => Forbid(),
                ResultStatus.Conflict => Conflict(result.Error),
                ResultStatus.Invalid => BadRequest(result.Error),
                _ => StatusCode(500, result.Error)
            };
        }
    }
}