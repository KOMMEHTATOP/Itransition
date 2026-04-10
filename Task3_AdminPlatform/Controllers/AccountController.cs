using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task3_AdminPlatform.Data;
using Task3_AdminPlatform.Models;
using Task3_AdminPlatform.Services;

namespace Task3_AdminPlatform.Controllers
{
    public class AccountController : Controller
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly IServiceScopeFactory _scopeFactory;
        
        public AccountController(ApplicationDbContext dbContext, IServiceScopeFactory scopeFactory)
        {
            _dbContext = dbContext;
            _scopeFactory = scopeFactory;
        }

        [HttpGet]
        public IActionResult Register()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Register(RegisterViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var existingUser = await _dbContext.Users
                .AnyAsync(u => u.Email == model.Email);

            if (existingUser)
            {
                ModelState.AddModelError("Email", "This email address is already in use.");
                return View(model);
            }
            
            User newUser = new User
            {
                Id = Guid.NewGuid(),
                Name = model.FullName,
                Email = model.Email,
                Password = model.Password,
                RegistrationTime = DateTime.UtcNow,
                Status = "Unverified"
            };

            _dbContext.Users.Add(newUser);
            await _dbContext.SaveChangesAsync();

            var confirmationLink = Url.Action("ConfirmEmail", "Account", 
                new { userId = newUser.Id }, Request.Scheme);
            if (string.IsNullOrEmpty(confirmationLink))
            {
                TempData["SuccessMessage"] = "Registration successful, but there was an error generating the link.";
                return RedirectToAction("Login");
            }
            
            _ = Task.Run(async () =>
            {
                using var scope = _scopeFactory.CreateScope();
                var scopedEmailService = scope.ServiceProvider.GetRequiredService<EmailService>();
                await scopedEmailService.SendConfirmationEmailAsync(newUser.Email, confirmationLink);
            });
            
            TempData["SuccessMessage"] = "Registration successful! You can log in now. Confirmation link has been sent to your email.";
            
            
            
            return RedirectToAction("Login");
        }

        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }
        
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Login(LoginViewModel model)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == model.Email);

            if (user == null || user.Password != model.Password) 
            {
                ModelState.AddModelError("", "Invalid email or password");
                return View(model);
            }

            if (user.Status == "Blocked") 
            {
                ModelState.AddModelError("", "Your account is blocked.");
                return View(model);
            }
    
            user.LastLoginTime = DateTime.UtcNow;
            await _dbContext.SaveChangesAsync();

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email),
            };

            var claimsIdentity = new ClaimsIdentity(claims, "Cookies");
            await HttpContext.SignInAsync("Cookies", new ClaimsPrincipal(claimsIdentity));

            return RedirectToAction("Index", "Admin"); 
        }
        
        [HttpGet]
        public async Task<IActionResult> ConfirmEmail(Guid userId)
        {
            var user = await _dbContext.Users.FindAsync(userId);

            if (user == null) return NotFound();

            if (user.Status == "Unverified")
            {
                user.Status = "Active";
                await _dbContext.SaveChangesAsync();
                TempData["SuccessMessage"] = "Email confirmed! You can now log in.";
            }

            return RedirectToAction("Login");
        }
        
        [HttpPost]
        public async Task<IActionResult> Logout()
        {
            await HttpContext.SignOutAsync("Cookies");
            return RedirectToAction("Login");
        }
        
        
    }
}