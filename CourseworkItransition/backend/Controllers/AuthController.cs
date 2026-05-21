using System.Security.Claims;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using AspNet.Security.OAuth.GitHub;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[Route("api/auth")]
public class AuthController : ApiControllerBase
{
    private readonly IAuthService _authService;
    private readonly IConfiguration _config;
    private readonly IWebHostEnvironment _env;

    public AuthController(IAuthService authService, IConfiguration config, IWebHostEnvironment env)
    {
        _authService = authService;
        _config = config;
        _env = env;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        return FromResult(await _authService.Register(req));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        return FromResult(await _authService.Login(req));
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        return FromResult(await _authService.Me(UserId()!));
    }

    [HttpGet("google")]
    public IActionResult GoogleLogin()
    {
        var redirectUrl = Url.Action(nameof(GoogleCallback), "Auth");
        var props = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(props, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback()
    {
        return await HandleOAuthCallbackAsync();
    }

    [HttpGet("github")]
    public IActionResult GitHubLogin()
    {
        var redirectUrl = Url.Action(nameof(GitHubCallback), "Auth");
        var props = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(props, GitHubAuthenticationDefaults.AuthenticationScheme);
    }

    [HttpGet("github/callback")]
    public async Task<IActionResult> GitHubCallback()
    {
        return await HandleOAuthCallbackAsync();
    }

    private async Task<IActionResult> HandleOAuthCallbackAsync()
    {
        var result = await HttpContext.AuthenticateAsync("External");
        if (!result.Succeeded)
            return Redirect($"{FrontendUrl}/login?error=oauth_failed");

        var email = result.Principal!.FindFirstValue(ClaimTypes.Email);
        var name = result.Principal.FindFirstValue(ClaimTypes.Name);

        if (string.IsNullOrEmpty(email))
        {
            var login = result.Principal.FindFirstValue(ClaimTypes.NameIdentifier)
                        ?? Guid.NewGuid().ToString("N");
            email = $"github_{login}@noemail.placeholder";
        }

        var oauthResult = await _authService.HandleOAuthAsync(email, name);
        if (!oauthResult.IsSuccess)
            return Redirect($"{FrontendUrl}/login?error=oauth_failed");

        return Redirect($"{FrontendUrl}/auth/callback?token={Uri.EscapeDataString(oauthResult.Value!)}");
    }

    private string FrontendUrl =>
        _env.IsProduction()
            ? _config.GetValue<string>("Frontend:ProdUrl") ?? "https://app.basharov.org"
            : _config.GetValue<string>("Frontend:Url") ?? "http://localhost:5173";
}