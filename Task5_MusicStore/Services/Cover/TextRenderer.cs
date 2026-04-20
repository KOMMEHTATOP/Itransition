using SkiaSharp;

namespace Task5_MusicStore.Services.Cover;

public static class TextRenderer
{
    private static readonly SKTypeface Typeface = LoadTypeface();

    private static SKTypeface LoadTypeface()
    {
        var fontPath = Path.Combine(AppContext.BaseDirectory, "Assets", "Fonts", "Inter_18pt-Regular.ttf");
    
        if (!File.Exists(fontPath))
        {
            Console.WriteLine($"[TextRenderer] WARNING: Font file not found at {fontPath}");
            Console.WriteLine($"[TextRenderer] BaseDirectory = {AppContext.BaseDirectory}");
            return SKTypeface.Default;
        }
    
        try
        {
            using var stream = File.OpenRead(fontPath);
            var typeface = SKTypeface.FromStream(stream);
        
            if (typeface == null)
            {
                Console.WriteLine("[TextRenderer] FromStream returned null, using Default");
                return SKTypeface.Default;
            }
        
            Console.WriteLine($"[TextRenderer] Font loaded: {typeface.FamilyName}");
            return typeface;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[TextRenderer] Exception loading font: {ex.Message}");
            return SKTypeface.Default;
        }
    }

    public static void DrawTextBlock(SKCanvas canvas, string title, string artist, int size)
    {
        DrawOverlay(canvas, size);
        DrawDividerLine(canvas, size);
        DrawTitle(canvas, title, size);
        DrawArtist(canvas, artist, size);
    }

    private static void DrawOverlay(SKCanvas canvas, int size)
    {
        using var paint = new SKPaint();
        using var shader = SKShader.CreateLinearGradient(
            new SKPoint(0, size - 160),
            new SKPoint(0, size),
            new[] { new SKColor(0, 0, 0, 0), new SKColor(0, 0, 0, 210) },
            SKShaderTileMode.Clamp);
        paint.Shader = shader;
        canvas.DrawRect(0, size - 160, size, 160, paint);
    }

    private static void DrawDividerLine(SKCanvas canvas, int size)
    {
        using var paint = new SKPaint
        {
            Color = new SKColor(255, 255, 255, 120),
            StrokeWidth = 1,
            Style = SKPaintStyle.Stroke
        };
        canvas.DrawLine(24, size - 110, size - 24, size - 110, paint);
    }

    private static void DrawTitle(SKCanvas canvas, string title, int size)
    {
        float titleSize = title.Length > 16 ? 28 : title.Length > 10 ? 34 : 40;
        using var paint = new SKPaint
        {
            Color = SKColors.White,
            IsAntialias = true,
            TextSize = titleSize,
            FakeBoldText = true,
            TextAlign = SKTextAlign.Left,
            Typeface = Typeface
        };

        string display = TrimText(title, paint, size - 48);
        canvas.DrawText(display, 24, size - 70, paint);
    }

    private static void DrawArtist(SKCanvas canvas, string artist, int size)
    {
        using var paint = new SKPaint
        {
            Color = new SKColor(200, 200, 200, 220),
            IsAntialias = true,
            TextSize = 22,
            TextAlign = SKTextAlign.Left,
            Typeface = Typeface
        };

        string display = TrimText(artist, paint, size - 48);
        canvas.DrawText(display, 24, size - 38, paint);
    }

    private static string TrimText(string text, SKPaint paint, float maxWidth)
    {
        while (paint.MeasureText(text) > maxWidth && text.Length > 3)
            text = text[..^4] + "...";
        return text;
    }
}