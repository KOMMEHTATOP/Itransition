using InventoryApi.Services;
using InventoryApi.Services.Interfaces;

namespace InventoryApi.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<CustomIdGeneratorService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IInventoryService, InventoryService>();
        services.AddScoped<IItemService, ItemService>();
        services.AddScoped<ICommentService, CommentService>();
        services.AddScoped<ISearchService, SearchService>();
        services.AddScoped<IUserService, UserService>();
        
        return services;
    }
}