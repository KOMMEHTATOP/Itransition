using Task5_MusicStore.Services;
using Task5_MusicStore.Services.Lyrics;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllersWithViews();
builder.Services.AddSingleton<SongGeneratorService>();
builder.Services.AddSingleton<CoverService>();
builder.Services.AddSingleton<AudioService>();
builder.Services.AddSingleton<LyricsGenerator>();

var app = builder.Build();

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseRouting();
app.UseStaticFiles();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.MapControllers();

app.Run();