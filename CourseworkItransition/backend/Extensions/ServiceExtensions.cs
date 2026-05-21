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
        services.AddScoped<ITagService, TagService>();
        services.AddScoped<IAccessService, AccessService>();
        services.AddScoped<IInventoryFieldService, InventoryFieldService>();
        services.AddScoped<ICustomIdService, CustomIdService>();
        
        return services;
    }
}