namespace InventoryApi.Extensions;

public static class CorsExtensions
{
    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddCors(options =>
        {
            options.AddPolicy("Dev", policy =>
            {
                var origins = new List<string>
                {
                    configuration.GetValue<string>("Frontend:Url") ?? "http://localhost:5173",
                };
                var prod = configuration.GetValue<string>("Frontend:ProdUrl");
                if (!string.IsNullOrEmpty(prod)) origins.Add(prod);

                var pages = configuration.GetValue<string>("Frontend:PagesUrl");
                if (!string.IsNullOrEmpty(pages)) origins.Add(pages);

                policy.WithOrigins([.. origins])
                    .AllowAnyHeader()
                    .AllowAnyMethod()
                    .AllowCredentials();
            });
        });
        
        return services;
    }
}