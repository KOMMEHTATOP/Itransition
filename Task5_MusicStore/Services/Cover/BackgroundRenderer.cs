using SkiaSharp;

namespace Task5_MusicStore.Services.Cover;

public static class BackgroundRenderer
{
    private static readonly SKColor[][] ColorPalettes = {
        new[] { SKColor.Parse("#FF6B35"), SKColor.Parse("#F7C59F") },
        new[] { SKColor.Parse("#1A1A2E"), SKColor.Parse("#16213E") },
        new[] { SKColor.Parse("#6B35FF"), SKColor.Parse("#A855F7") },
        new[] { SKColor.Parse("#FF3566"), SKColor.Parse("#FF6B9D") },
        new[] { SKColor.Parse("#00B4D8"), SKColor.Parse("#0077B6") },
        new[] { SKColor.Parse("#2D6A4F"), SKColor.Parse("#52B788") },
        new[] { SKColor.Parse("#E9C46A"), SKColor.Parse("#F4A261") },
        new[] { SKColor.Parse("#1D3557"), SKColor.Parse("#457B9D") },
        new[] { SKColor.Parse("#370617"), SKColor.Parse("#E85D04") },
        new[] { SKColor.Parse("#3A0CA3"), SKColor.Parse("#7209B7") },
    };

    public static SKColor[] GetPalette(Random rng)
        => ColorPalettes[rng.Next(ColorPalettes.Length)];

    public static void DrawGradient(SKCanvas canvas, SKColor[] palette, int size)
    {
        using var paint = new SKPaint();
        using var shader = SKShader.CreateLinearGradient(
            new SKPoint(0, 0),
            new SKPoint(size, size),
            palette,
            SKShaderTileMode.Clamp);
        paint.Shader = shader;
        canvas.DrawRect(0, 0, size, size, paint);
    }

    public static void DrawPattern(SKCanvas canvas, Random rng, int size)
    {
        using var paint = new SKPaint { IsAntialias = true };
        int patternType = rng.Next(4);

        switch (patternType)
        {
            case 0:
                DrawCircles(canvas, paint, rng, size);
                break;
            case 1:
                DrawStripes(canvas, paint, size);
                break;
            case 2:
                DrawDots(canvas, paint, size);
                break;
            default:
                DrawBlobs(canvas, paint, size);
                break;
        }
    }

    private static void DrawCircles(SKCanvas canvas, SKPaint paint, Random rng, int size)
    {
        for (int i = 0; i < 8; i++)
        {
            paint.Color = new SKColor(255, 255, 255, 40);
            paint.Style = SKPaintStyle.Stroke;
            paint.StrokeWidth = 2;
            canvas.DrawCircle(size / 2f, size / 2f, 60 + i * 30, paint);
        }
    }

    private static void DrawStripes(SKCanvas canvas, SKPaint paint, int size)
    {
        paint.Style = SKPaintStyle.Fill;
        for (int i = -2; i < 8; i++)
        {
            paint.Color = new SKColor(255, 255, 255, 15);
            float x = i * 70f;
            using var path = new SKPath();
            path.MoveTo(x, 0);
            path.LineTo(x + 50, 0);
            path.LineTo(x + 50 + size, size);
            path.LineTo(x + size, size);
            path.Close();
            canvas.DrawPath(path, paint);
        }
    }

    private static void DrawDots(SKCanvas canvas, SKPaint paint, int size)
    {
        paint.Style = SKPaintStyle.Fill;
        paint.Color = new SKColor(255, 255, 255, 25);
        for (int x = 30; x < size; x += 40)
            for (int y = 30; y < size; y += 40)
                canvas.DrawCircle(x, y, 3, paint);
    }

    private static void DrawBlobs(SKCanvas canvas, SKPaint paint, int size)
    {
        paint.Style = SKPaintStyle.Fill;
        paint.Color = new SKColor(255, 255, 255, 20);
        canvas.DrawCircle(size * 0.7f, size * 0.3f, 180, paint);
        paint.Color = new SKColor(0, 0, 0, 20);
        canvas.DrawCircle(size * 0.2f, size * 0.8f, 150, paint);
    }
}