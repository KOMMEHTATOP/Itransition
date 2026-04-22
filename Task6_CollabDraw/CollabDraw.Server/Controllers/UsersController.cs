using CollabDraw.Server.Data;
using CollabDraw.Server.DTOs;
using CollabDraw.Server.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CollabDraw.Server.Controllers;

[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db)
    {
        _db = db;
    }

    // POST /api/users — создать пользователя
    [HttpPost]
    public async Task<ActionResult<UserResponse>> Create([FromBody] CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Length > 30)
            return BadRequest("Display name must be 1-30 characters.");

        var user = new User
        {
            Id = Guid.NewGuid(),
            Token = Guid.NewGuid(),
            DisplayName = request.DisplayName.Trim()
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return Created($"/api/users/{user.Id}", new UserResponse(user.Id, user.Token, user.DisplayName));
    }

    // GET /api/users/me — получить текущего пользователя по токену
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> GetMe()
    {
        var token = GetTokenFromHeader();
        if (token == null)
            return Unauthorized("Missing X-User-Token header.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Token == token.Value);
        if (user == null)
            return NotFound("User not found.");

        user.LastSeenAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new UserResponse(user.Id, user.Token, user.DisplayName));
    }

    // PUT /api/users/me — обновить имя
    [HttpPut("me")]
    public async Task<ActionResult<UserResponse>> UpdateMe([FromBody] UpdateUserRequest request)
    {
        var token = GetTokenFromHeader();
        if (token == null)
            return Unauthorized("Missing X-User-Token header.");

        if (string.IsNullOrWhiteSpace(request.DisplayName) || request.DisplayName.Length > 30)
            return BadRequest("Display name must be 1-30 characters.");

        var user = await _db.Users.FirstOrDefaultAsync(u => u.Token == token.Value);
        if (user == null)
            return NotFound("User not found.");

        user.DisplayName = request.DisplayName.Trim();
        user.LastSeenAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new UserResponse(user.Id, user.Token, user.DisplayName));
    }

    private Guid? GetTokenFromHeader()
    {
        if (Request.Headers.TryGetValue("X-User-Token", out var value)
            && Guid.TryParse(value, out var token))
            return token;
        return null;
    }
}