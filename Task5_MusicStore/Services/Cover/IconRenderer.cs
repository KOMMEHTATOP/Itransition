using SkiaSharp;

namespace Task5_MusicStore.Services.Cover;

public static class IconRenderer
{
    public static void DrawIcon(SKCanvas canvas, Random rng, int size)
    {
        int iconType = rng.Next(5);
        float cx = size / 2f;
        float cy = size / 2f - 20;
        float s = 80;

        using var paint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Fill,
            Color = new SKColor(255, 255, 255, 40)
        };

        switch (iconType)
        {
            case 0: DrawNote(canvas, paint, cx, cy); break;
            case 1: DrawStar(canvas, paint, cx, cy, s * 0.9f, s * 0.4f, 5); break;
            case 2: DrawLightning(canvas, cx, cy); break;
            case 3: DrawVinyl(canvas, cx, cy, s); break;
            case 4: DrawSoundWaves(canvas, cx, cy); break;
        }
    }

    private static void DrawNote(SKCanvas canvas, SKPaint paint, float cx, float cy)
    {
        canvas.DrawCircle(cx - 20, cy + 30, 28, paint);
        using var stroke = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 12,
            Color = new SKColor(255, 255, 255, 40)
        };
        canvas.DrawLine(cx + 8, cy + 30, cx + 8, cy - 50, stroke);
        canvas.DrawLine(cx + 8, cy - 50, cx + 50, cy - 35, stroke);
        canvas.DrawLine(cx + 50, cy - 35, cx + 50, cy - 10, stroke);
    }

    private static void DrawStar(SKCanvas canvas, SKPaint paint, float cx, float cy, float outerR, float innerR, int points)
    {
        using var path = new SKPath();
        double step = Math.PI / points;
        for (int i = 0; i < points * 2; i++)
        {
            double angle = i * step - Math.PI / 2;
            float r = i % 2 == 0 ? outerR : innerR;
            float x = cx + (float)(r * Math.Cos(angle));
            float y = cy + (float)(r * Math.Sin(angle));
            if (i == 0) path.MoveTo(x, y);
            else path.LineTo(x, y);
        }
        path.Close();
        canvas.DrawPath(path, paint);
    }

    private static void DrawLightning(SKCanvas canvas, float cx, float cy)
    {
        using var bolt = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Fill,
            Color = new SKColor(255, 255, 255, 50)
        };
        using var path = new SKPath();
        path.MoveTo(cx + 15, cy - 60);
        path.LineTo(cx - 20, cy + 10);
        path.LineTo(cx + 5, cy + 10);
        path.LineTo(cx - 15, cy + 60);
        path.LineTo(cx + 20, cy - 10);
        path.LineTo(cx - 5, cy - 10);
        path.Close();
        canvas.DrawPath(path, bolt);
    }

    private static void DrawVinyl(SKCanvas canvas, float cx, float cy, float s)
    {
        using var paint = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Fill };
        paint.Color = new SKColor(0, 0, 0, 60);
        canvas.DrawCircle(cx, cy, s, paint);
        paint.Color = new SKColor(255, 255, 255, 30);
        canvas.DrawCircle(cx, cy, s * 0.4f, paint);
        paint.Color = new SKColor(0, 0, 0, 60);
        canvas.DrawCircle(cx, cy, s * 0.15f, paint);
        using var stroke = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 1,
            Color = new SKColor(255, 255, 255, 15)
        };
        for (float r = s * 0.45f; r < s * 0.95f; r += 8)
            canvas.DrawCircle(cx, cy, r, stroke);
    }

    private static void DrawSoundWaves(SKCanvas canvas, float cx, float cy)
    {
        using var wave = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Stroke,
            StrokeWidth = 8,
            Color = new SKColor(255, 255, 255, 45),
            StrokeCap = SKStrokeCap.Round
        };
        float[] heights = { 20, 45, 70, 45, 20 };
        float startX = cx - 60;
        for (int i = 0; i < heights.Length; i++)
        {
            float bx = startX + i * 30;
            canvas.DrawLine(bx, cy - heights[i], bx, cy + heights[i], wave);
        }
    }
}