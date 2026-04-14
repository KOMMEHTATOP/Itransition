using SkiaSharp;
using Task5_MusicStore.Services.Cover;

namespace Task5_MusicStore.Services;

public class CoverService
{
    private const int Size = 400;

    public byte[] GenerateCover(long seed, int index, string title, string artist)
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
        return data.ToArray();
    }
}