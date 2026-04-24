using System.Security.Claims;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Services;
using Microsoft.AspNetCore.Authentication;
using AspNet.Security.OAuth.GitHub;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace InventoryApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly JwtService _jwt;
    private readonly IConfiguration _config;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        JwtService jwt,
        IConfiguration config)
    {
        _userManager = userManager;
        _jwt = jwt;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var existing = await _userManager.FindByEmailAsync(req.Email);
        if (existing != null)
            return Conflict(new { message = "Email already in use" });

        var user = new ApplicationUser
        {
            UserName = req.Email,
            Email = req.Email,
            DisplayName = req.DisplayName,
            EmailConfirmed = true,
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        await _userManager.AddToRoleAsync(user, "User");

        var token = await _jwt.GenerateTokenAsync(user);
        return Ok(new AuthResponse(token, await MapUserAsync(user)));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, req.Password))
            return Unauthorized(new { message = "Invalid credentials" });

        if (user.IsBlocked)
            return StatusCode(403, new { message = "Account is blocked" });

        var token = await _jwt.GenerateTokenAsync(user);
        return Ok(new AuthResponse(token, await MapUserAsync(user)));
    }

    [HttpGet("google")]
    public IActionResult GoogleLogin()
    {
        var redirectUrl = Url.Action(nameof(GoogleCallback), "Auth");
        var props = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(props, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("google/callback")]
    public async Task<IActionResult> GoogleCallback() =>
        await HandleOAuthCallbackAsync();

    [HttpGet("github")]
    public IActionResult GitHubLogin()
    {
        var redirectUrl = Url.Action(nameof(GitHubCallback), "Auth");
        var props = new AuthenticationProperties { RedirectUri = redirectUrl };
        return Challenge(props, GitHubAuthenticationDefaults.AuthenticationScheme);
    }

    [HttpGet("github/callback")]
    public async Task<IActionResult> GitHubCallback() =>
        await HandleOAuthCallbackAsync();

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null) return NotFound();
        return Ok(await MapUserAsync(user));
    }

    private async Task<IActionResult> HandleOAuthCallbackAsync()
    {
        var result = await HttpContext.AuthenticateAsync("External");
        if (!result.Succeeded)
            return Redirect($"{FrontendUrl}/login?error=oauth_failed");

        var email = result.Principal!.FindFirstValue(ClaimTypes.Email);
        var name = result.Principal.FindFirstValue(ClaimTypes.Name);

        // GitHub may not expose email if user keeps it private — generate a placeholder
        if (string.IsNullOrEmpty(email))
        {
            var login = result.Principal.FindFirstValue(ClaimTypes.NameIdentifier) ?? Guid.NewGuid().ToString("N");
            email = $"github_{login}@noemail.placeholder";
        }

        var user = await _userManager.FindByEmailAsync(email);
        if (user == null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                DisplayName = name ?? email,
                EmailConfirmed = true,
            };
            var createResult = await _userManager.CreateAsync(user);
            if (!createResult.Succeeded)
                return Redirect($"{FrontendUrl}/login?error=create_failed");

            await _userManager.AddToRoleAsync(user, "User");
        }

        if (user.IsBlocked)
            return Redirect($"{FrontendUrl}/login?error=blocked");

        var token = await _jwt.GenerateTokenAsync(user);
        return Redirect($"{FrontendUrl}/auth/callback?token={Uri.EscapeDataString(token)}");
    }

    private string FrontendUrl =>
        _config.GetValue<string>("Frontend:Url") ?? "http://localhost:5173";

    private async Task<UserDto> MapUserAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new UserDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl, roles);
    }
}
