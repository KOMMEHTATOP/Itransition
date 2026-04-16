using Microsoft.Extensions.Caching.Memory;
using SkiaSharp;
using Task5_MusicStore.Services.Cover;

namespace Task5_MusicStore.Services;

public class CoverService
{
    private const int Size = 400;
    private readonly IMemoryCache _cache;

    public CoverService(IMemoryCache cache)
    {
        _cache = cache;
    }

    public byte[] GenerateCover(long seed, int index, string title, string artist)
    {
        var cacheKey = $"cover_{seed}_{index}";
        
        if (_cache.TryGetValue(cacheKey, out byte[]? cached))
            return cached!;

        long coverSeed = seed ^ (long)index * 2654435761;
        var rng = new Random((int)(coverSeed & 0x7FFFFFFF));

        using var surface = SKSurface.Create(new SKImageInfo(Size, Size));
        var canvas = surface.Canvas;

        var palette = BackgroundRenderer.GetPalette(rng);
        BackgroundRenderer.DrawGradient(canvas, palette, Size);
        BackgroundRenderer.DrawPattern(canvas, rng, Size);
        IconRenderer.DrawIcon(canvas, rng, Size);
        TextRenderer.DrawTextBlock(canvas, title, artist, Size);

        using var image = surface.Snapshot();
        using var data = image.Encode(SKEncodedImageFormat.Png, 95);
        var result = data.ToArray();

        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
        return result;
    }
}