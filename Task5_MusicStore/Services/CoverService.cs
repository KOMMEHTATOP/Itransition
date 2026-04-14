using SkiaSharp;

namespace Task5_MusicStore.Services;

public class CoverService
{
    private static readonly int Size = 400;

    private static readonly SKColor[][] ColorPalettes = {
        new[] { SKColor.Parse("#FF6B35"), SKColor.Parse("#F7C59F") }, // Orange warm
        new[] { SKColor.Parse("#1A1A2E"), SKColor.Parse("#16213E") }, // Dark blue
        new[] { SKColor.Parse("#6B35FF"), SKColor.Parse("#A855F7") }, // Purple
        new[] { SKColor.Parse("#FF3566"), SKColor.Parse("#FF6B9D") }, // Pink red
        new[] { SKColor.Parse("#00B4D8"), SKColor.Parse("#0077B6") }, // Ocean blue
        new[] { SKColor.Parse("#2D6A4F"), SKColor.Parse("#52B788") }, // Forest green
        new[] { SKColor.Parse("#E9C46A"), SKColor.Parse("#F4A261") }, // Golden
        new[] { SKColor.Parse("#1D3557"), SKColor.Parse("#457B9D") }, // Navy
        new[] { SKColor.Parse("#370617"), SKColor.Parse("#E85D04") }, // Dark orange
        new[] { SKColor.Parse("#3A0CA3"), SKColor.Parse("#7209B7") }, // Deep purple
    };

    public byte[] GenerateCover(long seed, int index, string title, string artist)
    {
        long coverSeed = seed ^ (long)index * 2654435761;
        var rng = new Random((int)(coverSeed & 0x7FFFFFFF));

        using var surface = SKSurface.Create(new SKImageInfo(Size, Size));
        var canvas = surface.Canvas;

        var palette = ColorPalettes[rng.Next(ColorPalettes.Length)];
        DrawBackground(canvas, rng, palette);
        DrawDecorativeElements(canvas, rng, palette);
        DrawIcon(canvas, rng);
        DrawTextBlock(canvas, title, artist, palette);

        using var image = surface.Snapshot();
        using var data = image.Encode(SKEncodedImageFormat.Png, 95);
        return data.ToArray();
    }

    private void DrawBackground(SKCanvas canvas, Random rng, SKColor[] palette)
    {
        using var paint = new SKPaint();
        using var shader = SKShader.CreateLinearGradient(
            new SKPoint(0, 0),
            new SKPoint(Size, Size),
            palette,
            SKShaderTileMode.Clamp);
        paint.Shader = shader;
        canvas.DrawRect(0, 0, Size, Size, paint);
    }

    private void DrawDecorativeElements(SKCanvas canvas, Random rng, SKColor[] palette)
    {
        int style = rng.Next(4);

        using var paint = new SKPaint { IsAntialias = true };

        if (style == 0)
        {
            // Концентрические круги
            for (int i = 0; i < 5; i++)
            {
                float r = 60 + i * 50;
                paint.Color = new SKColor(255, 255, 255, (byte)(15 + i * 8));
                paint.Style = SKPaintStyle.Stroke;
                paint.StrokeWidth = 2;
                canvas.DrawCircle(Size / 2f, Size / 2f, r, paint);
            }
        }
        else if (style == 1)
        {
            // Диагональные полосы
            paint.Style = SKPaintStyle.Fill;
            for (int i = -2; i < 8; i++)
            {
                paint.Color = new SKColor(255, 255, 255, 15);
                float x = i * 70f;
                using var path = new SKPath();
                path.MoveTo(x, 0);
                path.LineTo(x + 50, 0);
                path.LineTo(x + 50 + Size, Size);
                path.LineTo(x + Size, Size);
                path.Close();
                canvas.DrawPath(path, paint);
            }
        }
        else if (style == 2)
        {
            // Сетка точек
            paint.Style = SKPaintStyle.Fill;
            paint.Color = new SKColor(255, 255, 255, 25);
            for (int x = 30; x < Size; x += 40)
                for (int y = 30; y < Size; y += 40)
                    canvas.DrawCircle(x, y, 3, paint);
        }
        else
        {
            // Большой круг сзади
            paint.Style = SKPaintStyle.Fill;
            paint.Color = new SKColor(255, 255, 255, 20);
            canvas.DrawCircle(Size * 0.7f, Size * 0.3f, 180, paint);
            paint.Color = new SKColor(0, 0, 0, 20);
            canvas.DrawCircle(Size * 0.2f, Size * 0.8f, 150, paint);
        }
    }

    private void DrawIcon(SKCanvas canvas, Random rng)
    {
        int iconType = rng.Next(5);
        using var paint = new SKPaint
        {
            IsAntialias = true,
            Style = SKPaintStyle.Fill,
            Color = new SKColor(255, 255, 255, 40)
        };

        float cx = Size / 2f;
        float cy = Size / 2f - 20;
        float s = 80;

        switch (iconType)
        {
            case 0: // Нота
                canvas.DrawCircle(cx - 20, cy + 30, 28, paint);
                using (var stroke = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Stroke, StrokeWidth = 12, Color = new SKColor(255, 255, 255, 40) })
                {
                    canvas.DrawLine(cx + 8, cy + 30, cx + 8, cy - 50, stroke);
                    canvas.DrawLine(cx + 8, cy - 50, cx + 50, cy - 35, stroke);
                    canvas.DrawLine(cx + 50, cy - 35, cx + 50, cy - 10, stroke);
                }
                break;

            case 1: // Звезда (5-конечная)
                DrawStar(canvas, paint, cx, cy, s * 0.9f, s * 0.4f, 5);
                break;

            case 2: // Молния
                using (var bolt = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Fill, Color = new SKColor(255, 255, 255, 50) })
                {
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
                break;

            case 3: // Vinyl record
                paint.Color = new SKColor(0, 0, 0, 60);
                canvas.DrawCircle(cx, cy, s, paint);
                paint.Color = new SKColor(255, 255, 255, 30);
                canvas.DrawCircle(cx, cy, s * 0.4f, paint);
                paint.Color = new SKColor(0, 0, 0, 60);
                canvas.DrawCircle(cx, cy, s * 0.15f, paint);
                using (var stroke = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Stroke, StrokeWidth = 1, Color = new SKColor(255, 255, 255, 15) })
                {
                    for (float r = s * 0.45f; r < s * 0.95f; r += 8)
                        canvas.DrawCircle(cx, cy, r, stroke);
                }
                break;

            case 4: // Волны (звук)
                using (var wave = new SKPaint { IsAntialias = true, Style = SKPaintStyle.Stroke, StrokeWidth = 8, Color = new SKColor(255, 255, 255, 45), StrokeCap = SKStrokeCap.Round })
                {
                    float[] heights = { 20, 45, 70, 45, 20 };
                    float startX = cx - 60;
                    for (int i = 0; i < heights.Length; i++)
                    {
                        float bx = startX + i * 30;
                        canvas.DrawLine(bx, cy - heights[i], bx, cy + heights[i], wave);
                    }
                }
                break;
        }
    }

    private void DrawStar(SKCanvas canvas, SKPaint paint, float cx, float cy, float outerR, float innerR, int points)
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

    private void DrawTextBlock(SKCanvas canvas, string title, string artist, SKColor[] palette)
    {
        // Тёмный градиент снизу
        using var overlayPaint = new SKPaint();
        using var overlayShader = SKShader.CreateLinearGradient(
            new SKPoint(0, Size - 160),
            new SKPoint(0, Size),
            new[] { new SKColor(0, 0, 0, 0), new SKColor(0, 0, 0, 210) },
            SKShaderTileMode.Clamp);
        overlayPaint.Shader = overlayShader;
        canvas.DrawRect(0, Size - 160, Size, 160, overlayPaint);

        // Тонкая цветная линия над текстом
        using var linePaint = new SKPaint
        {
            Color = new SKColor(255, 255, 255, 120),
            StrokeWidth = 1,
            Style = SKPaintStyle.Stroke
        };
        canvas.DrawLine(24, Size - 110, Size - 24, Size - 110, linePaint);

        // Название — подгоняем размер если длинное
        float titleSize = title.Length > 16 ? 28 : title.Length > 10 ? 34 : 40;
        using var titlePaint = new SKPaint
        {
            Color = SKColors.White,
            IsAntialias = true,
            TextSize = titleSize,
            FakeBoldText = true,
            TextAlign = SKTextAlign.Left
        };

        // Обрезаем если не влезает
        string displayTitle = title;
        while (titlePaint.MeasureText(displayTitle) > Size - 48 && displayTitle.Length > 3)
            displayTitle = displayTitle[..^4] + "...";

        canvas.DrawText(displayTitle, 24, Size - 70, titlePaint);

        // Артист
        using var artistPaint = new SKPaint
        {
            Color = new SKColor(200, 200, 200, 220),
            IsAntialias = true,
            TextSize = 22,
            TextAlign = SKTextAlign.Left
        };

        string displayArtist = artist;
        while (artistPaint.MeasureText(displayArtist) > Size - 48 && displayArtist.Length > 3)
            displayArtist = displayArtist[..^4] + "...";

        canvas.DrawText(displayArtist, 24, Size - 38, artistPaint);
    }
}