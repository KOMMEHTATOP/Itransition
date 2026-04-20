using Microsoft.Extensions.Caching.Memory;
using SkiaSharp;
using Task5_MusicStore.Services.Cover;

namespace Task5_MusicStore.Services;

public class CoverService
{
    private const int Size = 400;
    private readonly IMemoryCache _cache;
    private readonly HttpClient _httpClient;

    public CoverService(IMemoryCache cache, IHttpClientFactory httpClientFactory)
    {
        _cache = cache;
        _httpClient = httpClientFactory.CreateClient();
    }

    public async Task<byte[]> GenerateCoverAsync(long seed, int index, string locale, string title, string artist)
    {
        var cacheKey = $"cover_{seed}_{index}_{locale}";

        if (_cache.TryGetValue(cacheKey, out byte[]? cached))
            return cached!;

        var localeSuffix = locale.GetHashCode();
        var picsumSeed = $"{seed}-{index}-{localeSuffix}";
        var imageUrl = $"https://picsum.photos/seed/{picsumSeed}/{Size}/{Size}";

        byte[] photoBytes;
        try
        {
            photoBytes = await _httpClient.GetByteArrayAsync(imageUrl);
        }
        catch
        {
            return GenerateFallback(seed, index, title, artist, cacheKey);
        }

        var result = DrawTextOnPhoto(photoBytes, title, artist);
        _cache.Set(cacheKey, result, TimeSpan.FromMinutes(30));
        return result;
    }

    private byte[] DrawTextOnPhoto(byte[] photoBytes, string title, string artist)
    {
        using var photoBitmap = SKBitmap.Decode(photoBytes);
        using var surface = SKSurface.Create(new SKImageInfo(Size, Size));
        var canvas = surface.Canvas;

        using var scaledBitmap = photoBitmap.Resize(new SKImageInfo(Size, Size), SKFilterQuality.High);
        canvas.DrawBitmap(scaledBitmap, 0, 0);

        using var overlayPaint = new SKPaint();
        using var overlayShader = SKShader.CreateLinearGradient(
            new SKPoint(0, Size - 180),
            new SKPoint(0, Size),
            new[] { new SKColor(0, 0, 0, 0), new SKColor(0, 0, 0, 230) },
            SKShaderTileMode.Clamp);
        overlayPaint.Shader = overlayShader;
        canvas.DrawRect(0, Size - 180, Size, 180, overlayPaint);

        using var linePaint = new SKPaint
        {
            Color = new SKColor(255, 255, 255, 100),
            StrokeWidth = 1,
            Style = SKPaintStyle.Stroke
        };
        canvas.DrawLine(24, Size - 115, Size - 24, Size - 115, linePaint);

        float titleSize = title.Length > 16 ? 28 : title.Length > 10 ? 34 : 40;
        using var titlePaint = new SKPaint
        {
            Color = SKColors.White,
            IsAntialias = true,
            TextSize = titleSize,
            FakeBoldText = true,
            TextAlign = SKTextAlign.Left,
            Typeface = TextRenderer.Typeface
        };

        string displayTitle = title;
        while (titlePaint.MeasureText(displayTitle) > Size - 48 && displayTitle.Length > 3)
            displayTitle = displayTitle[..^4] + "...";
        canvas.DrawText(displayTitle, 24, Size - 72, titlePaint);

        using var artistPaint = new SKPaint
        {
            Color = new SKColor(220, 220, 220, 220),
            IsAntialias = true,
            TextSize = 22,
            TextAlign = SKTextAlign.Left,
            Typeface = TextRenderer.Typeface
        };

        string displayArtist = artist;
        while (artistPaint.MeasureText(displayArtist) > Size - 48 && displayArtist.Length > 3)
            displayArtist = displayArtist[..^4] + "...";
        canvas.DrawText(displayArtist, 24, Size - 38, artistPaint);

        using var image = surface.Snapshot();
        using var data = image.Encode(SKEncodedImageFormat.Png, 95);
        return data.ToArray();
    }

    private byte[] GenerateFallback(long seed, int index, string title, string artist, string cacheKey)
    {
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