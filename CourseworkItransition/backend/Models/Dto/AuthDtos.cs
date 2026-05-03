using System.ComponentModel.DataAnnotations;

namespace InventoryApi.Models.Dto;

public record RegisterRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(6)] string Password,
    [Required, MinLength(1)] string DisplayName);

public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public record AuthResponse(string Token, UserDto User);

public record UserDto(
    string Id,
    string Email,
    string DisplayName,
    string? AvatarUrl,
    IList<string> Roles);

public record AdminUserDto(
    string Id,
    string DisplayName,
    string Email,
    bool IsBlocked,
    bool IsAdmin,
    DateTime CreatedAt,
    int InventoryCount);
