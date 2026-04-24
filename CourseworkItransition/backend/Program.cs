using System.Text;
using AspNet.Security.OAuth.GitHub;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Identity
builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequireUppercase = false;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Authentication: JWT + External cookie (for OAuth flow) + Google + Facebook
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultSignInScheme = "External";
})
.AddJwtBearer(options =>
{
    var key = builder.Configuration["Jwt:Key"]!;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
    };
})
.AddCookie("External", options =>
{
    options.ExpireTimeSpan = TimeSpan.FromMinutes(10);
})
.AddGoogle(options =>
{
    options.ClientId = builder.Configuration["Authentication:Google:ClientId"]!;
    options.ClientSecret = builder.Configuration["Authentication:Google:ClientSecret"]!;
    options.SignInScheme = "External";
})
.AddGitHub(options =>
{
    options.ClientId = builder.Configuration["Authentication:GitHub:ClientId"]!;
    options.ClientSecret = builder.Configuration["Authentication:GitHub:ClientSecret"]!;
    options.SignInScheme = "External";
    // Request email scope — GitHub users may have private emails
    options.Scope.Add("user:email");
});

builder.Services.AddScoped<JwtService>();

builder.Services.AddControllers();
builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Dev", policy =>
    {
        var origins = new List<string>
        {
            builder.Configuration.GetValue<string>("Frontend:Url") ?? "http://localhost:5173",
        };
        var prod = builder.Configuration.GetValue<string>("Frontend:ProdUrl");
        if (!string.IsNullOrEmpty(prod)) origins.Add(prod);

        policy.WithOrigins([.. origins])
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Seed roles and admin user
await SeedAsync(app.Services, app.Configuration);

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors("Dev");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

static async Task SeedAsync(IServiceProvider services, IConfiguration config)
{
    using var scope = services.CreateScope();
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

    foreach (var role in new[] { "Admin", "User" })
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }

    var adminEmail = config["Admin:Email"] ?? "admin@example.com";
    var adminUser = await userManager.FindByEmailAsync(adminEmail);
    if (adminUser == null)
    {
        adminUser = new ApplicationUser
        {
            UserName = adminEmail,
            Email = adminEmail,
            DisplayName = config["Admin:DisplayName"] ?? "Administrator",
            EmailConfirmed = true,
        };
        var password = config["Admin:Password"] ?? "Admin123!";
        await userManager.CreateAsync(adminUser, password);
        await userManager.AddToRoleAsync(adminUser, "Admin");
        await userManager.AddToRoleAsync(adminUser, "User");
    }
}
