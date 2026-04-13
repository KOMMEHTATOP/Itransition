using SkiaSharp;

namespace Task5_MusicStore.Services;

public class CoverService
{
    private static readonly int Size = 400;

    public byte[] GenerateCover(long seed, int index, string title, string artist)
    {
        long coverSeed = seed ^ (long)index * 2654435761;
        var rng = new Random((int)(coverSeed & 0x7FFFFFFF));

        using var surface = SKSurface.Create(new SKImageInfo(Size, Size));
        var canvas = surface.Canvas;

        DrawBackground(canvas, rng);
        DrawPattern(canvas, rng);
        DrawText(canvas, title, artist);

        using var image = surface.Snapshot();
        using var data = image.Encode(SKEncodedImageFormat.Png, 95);
        return data.ToArray();
    }

    private void DrawBackground(SKCanvas canvas, Random rng)
    {
        var color1 = RandomColor(rng, 40, 180);
        var color2 = RandomColor(rng, 40, 180);

        using var paint = new SKPaint();
        using var shader = SKShader.CreateLinearGradient(
            new SKPoint(0, 0),
            new SKPoint(Size, Size),
            new[] { color1, color2 },
            SKShaderTileMode.Clamp);

        paint.Shader = shader;
        canvas.DrawRect(0, 0, Size, Size, paint);
    }

    private void DrawPattern(SKCanvas canvas, Random rng)
    {
        using var paint = new SKPaint { IsAntialias = true };
        int patternType = rng.Next(3);

        for (int i = 0; i < 8; i++)
        {
            var color = RandomColor(rng, 100, 220);
            paint.Color = new SKColor(color.Red, color.Green, color.Blue, 40);

            float x = rng.Next(Size);
            float y = rng.Next(Size);
            float r = rng.Next(40, 180);

            if (patternType == 0)
                canvas.DrawCircle(x, y, r, paint);
            else if (patternType == 1)
                canvas.DrawRect(x - r / 2, y - r / 2, r, r, paint);
            else
            {
                using var path = new SKPath();
                path.MoveTo(x, y - r);
                path.LineTo(x + r, y + r);
                path.LineTo(x - r, y + r);
                path.Close();
                canvas.DrawPath(path, paint);
            }
        }
    }

    private void DrawText(SKCanvas canvas, string title, string artist)
    {
        // Dark overlay at bottom
        using var overlayPaint = new SKPaint
        {
            Color = new SKColor(0, 0, 0, 160)
        };
        canvas.DrawRect(0, Size - 120, Size, 120, overlayPaint);

        // Title
        using var titlePaint = new SKPaint
        {
            Color = SKColors.White,
            IsAntialias = true,
            TextSize = 36,
            FakeBoldText = true,
            TextAlign = SKTextAlign.Center
        };
        canvas.DrawText(title, Size / 2f, Size - 70, titlePaint);

        // Artist
        using var artistPaint = new SKPaint
        {
            Color = new SKColor(220, 220, 220, 255),
            IsAntialias = true,
            TextSize = 24,
            TextAlign = SKTextAlign.Center
        };
        canvas.DrawText(artist, Size / 2f, Size - 35, artistPaint);
    }

    private SKColor RandomColor(Random rng, int min, int max)
    {
        return new SKColor(
            (byte)rng.Next(min, max),
            (byte)rng.Next(min, max),
            (byte)rng.Next(min, max));
    }
}