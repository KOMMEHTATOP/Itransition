using Microsoft.AspNetCore.Authentication;
using System.Security.Claims;
using Task3_AdminPlatform.Data;
using Microsoft.EntityFrameworkCore;

namespace Task3_AdminPlatform.Middleware;

public class UserStatusMiddleware
{
    private readonly RequestDelegate _next;

    public UserStatusMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, ApplicationDbContext dbContext)
    {
        if (context.User.Identity?.IsAuthenticated == true)
        {
            var userIdClaim = context.User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (Guid.TryParse(userIdClaim, out var userId))
            {
                var user = await dbContext.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (user == null || user.Status == "Blocked")
                {
                    await context.SignOutAsync("Cookies");
                    
                    if (!context.Request.Path.StartsWithSegments("/Account/Login"))
                    {
                        context.Response.Redirect("/Account/Login");
                        return;
                    }
                }
            }
        }

        await _next(context);
    }
}