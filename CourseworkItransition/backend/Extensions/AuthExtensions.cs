using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

namespace InventoryApi.Extensions;

public static class AuthExtensions
{
    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultSignInScheme = "External";
        })
        .AddJwtBearer(options =>
        {
            var key = configuration["Jwt:Key"]!;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = configuration["Jwt:Issuer"],
                ValidAudience = configuration["Jwt:Audience"],
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            };
            // SignalR sends token via query string because WebSocket headers are not supported
            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var token = context.Request.Query["access_token"];
                    var path  = context.HttpContext.Request.Path;
                    if (!string.IsNullOrEmpty(token) && path.StartsWithSegments("/hubs"))
                        context.Token = token;
                    return Task.CompletedTask;
                }
            };
        })
        .AddCookie("External", options =>
        {
            options.ExpireTimeSpan = TimeSpan.FromMinutes(10);
        })
        .AddGoogle(options =>
        {
            options.ClientId = configuration["Authentication:Google:ClientId"]!;
            options.ClientSecret = configuration["Authentication:Google:ClientSecret"]!;
            options.SignInScheme = "External";
            options.CallbackPath = configuration["Authentication:Google:CallbackPath"] ?? "/signin-google";
        })
        .AddGitHub(options =>
        {
            options.ClientId = configuration["Authentication:GitHub:ClientId"]!;
            options.ClientSecret = configuration["Authentication:GitHub:ClientSecret"]!;
            options.SignInScheme = "External";
            options.Scope.Add("user:email");
            options.CallbackPath = configuration["Authentication:GitHub:CallbackPath"] ?? "/signin-github";
        });
        
        return services;
    }
}