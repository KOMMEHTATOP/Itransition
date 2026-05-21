using InventoryApi.Common;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Identity;

namespace InventoryApi.Services;

public class AuthService : IAuthService
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IJwtService _jwt;

    public AuthService(UserManager<ApplicationUser> userManager, IJwtService jwt)
    {
        _userManager = userManager;
        _jwt = jwt;
    }
    
    public async Task<Result<AuthResponse>> Register(RegisterRequest req)
    {
        var existing = await _userManager.FindByEmailAsync(req.Email);
        if (existing != null)
        {
            return Result<AuthResponse>.Failure(ResultStatus.Conflict, "Email already exists");
        }

        var user = new ApplicationUser
        {
            UserName = req.Email,
            Email = req.Email,
            DisplayName = req.DisplayName,
            EmailConfirmed = true,
        };

        var result = await _userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
        {
            return Result<AuthResponse>.Failure(ResultStatus.Error, result.Errors.First().Description);
        }

        await _userManager.AddToRoleAsync(user, "User");

        var token = await _jwt.GenerateTokenAsync(user);
        
        return Result<AuthResponse>.Success(new AuthResponse(token, await MapUserAsync(user)));
    }

    public async Task<Result<AuthResponse>> Login(LoginRequest req)
    {
        var user = await _userManager.FindByEmailAsync(req.Email);
        if (user == null || !await _userManager.CheckPasswordAsync(user, req.Password))
        {
            return Result<AuthResponse>.Failure(ResultStatus.Unauthorized, "Invalid username or password");
        }

        if (user.IsBlocked)
        {
            return Result<AuthResponse>.Failure(ResultStatus.Forbidden, "Account is blocked");
        }

        var token = await _jwt.GenerateTokenAsync(user);
        return Result<AuthResponse>.Success(new AuthResponse(token, await MapUserAsync(user)));
    }

    public async Task<Result<UserDto>> Me(string userId)
    {
        var user = await _userManager.FindByIdAsync(userId!);
        if (user == null)
        {
            return Result<UserDto>.Failure(ResultStatus.Error, "User not found");
        }
        return Result<UserDto>.Success(await MapUserAsync(user));
    }
    
    private async Task<UserDto> MapUserAsync(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new UserDto(user.Id, user.Email!, user.DisplayName, user.AvatarUrl, roles);
    }
    
    public async Task<Result<string>> HandleOAuthAsync(string email, string? name)
    {
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
                return Result<string>.Failure(ResultStatus.Error, "Failed to create user");

            await _userManager.AddToRoleAsync(user, "User");
        }

        if (user.IsBlocked)
            return Result<string>.Failure(ResultStatus.Forbidden, "Account is blocked");

        var token = await _jwt.GenerateTokenAsync(user);
        return Result<string>.Success(token);
    }
}