using System.Security.Claims;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task3_AdminPlatform.Data;
using Task3_AdminPlatform.Models;

namespace Task3_AdminPlatform.Controllers
{
    public class AccountController : Controller
    {
        private readonly ApplicationDbContext _dbContext;

        public AccountController(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        [HttpGet]
        public IActionResult Register()
        {
            return View();
        }

        [ValidateAntiForgeryToken]
        [HttpPost]
        public async Task<ActionResult> Register(RegisterViewModel model)
        {
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
            return RedirectToAction("Register", "Account");
        }


        public IActionResult Login()
        {
            return View();
        }

        [ValidateAntiForgeryToken]
        [HttpPost]
        public async Task<ActionResult> Login(LoginViewModel model)
        {
            var user = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == model.Email);
            if (user == null)
            {
                return NotFound("User not found");
            }

            if (user.Password == model.Password)
            {
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
            }
            
            return RedirectToAction("Index", "Admin");
        }
    }
}