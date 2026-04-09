using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Task3_AdminPlatform.Data;

namespace Task3_AdminPlatform.Controllers;

[Authorize] 
public class AdminController : Controller
{
    private readonly ApplicationDbContext _dbContext;

    public AdminController(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<IActionResult> Index()
    {
        var users = await _dbContext.Users
            .OrderByDescending(u => u.LastLoginTime) 
            .ToListAsync();
        return View(users);
    }

    [HttpPost]
    public async Task<IActionResult> Delete(List<Guid>? userIds)
    {
        if (userIds == null || !userIds.Any()) return RedirectToAction("Index");

        var usersToDelete = await _dbContext.Users.Where(u => userIds.Contains(u.Id)).ToListAsync();
        _dbContext.Users.RemoveRange(usersToDelete);
        await _dbContext.SaveChangesAsync();

        return await CheckIfCurrentUserAffected(userIds);
    }

    [HttpPost]
    public async Task<IActionResult> Block(List<Guid>? userIds)
    {
        if (userIds == null || !userIds.Any()) return RedirectToAction("Index");

        var usersToBlock = await _dbContext.Users.Where(u => userIds.Contains(u.Id)).ToListAsync();
        foreach (var user in usersToBlock) user.Status = "Blocked";
        
        await _dbContext.SaveChangesAsync();
        return await CheckIfCurrentUserAffected(userIds);
    }

    [HttpPost]
    public async Task<IActionResult> Unblock(List<Guid>? userIds)
    {
        if (userIds == null || !userIds.Any()) return RedirectToAction("Index");

        var usersToUnblock = await _dbContext.Users.Where(u => userIds.Contains(u.Id)).ToListAsync();
        foreach (var user in usersToUnblock) user.Status = "Active";

        await _dbContext.SaveChangesAsync();
        return RedirectToAction("Index");
    }
    
    [HttpPost]
    public async Task<IActionResult> DeleteUnverified()
    {
        var unverifiedUsers = await _dbContext.Users
            .Where(u => u.Status == "Unverified")
            .ToListAsync();

        if (!unverifiedUsers.Any())
        {
            return RedirectToAction("Index");
        }

        var unverifiedIds = unverifiedUsers.Select(u => u.Id).ToList();

        _dbContext.Users.RemoveRange(unverifiedUsers);
        await _dbContext.SaveChangesAsync();

        return await CheckIfCurrentUserAffected(unverifiedIds);
    }

    private async Task<IActionResult> CheckIfCurrentUserAffected(List<Guid> affectedIds)
    {
        var currentUserIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        
        if (string.IsNullOrEmpty(currentUserIdStr) || !Guid.TryParse(currentUserIdStr, out var currentUserId))
        {
            await HttpContext.SignOutAsync("Cookies");
            return RedirectToAction("Login", "Account");
        }

        if (affectedIds.Contains(currentUserId))
        {
            await HttpContext.SignOutAsync("Cookies");
            return RedirectToAction("Login", "Account");
        }

        return RedirectToAction("Index");
    }
}