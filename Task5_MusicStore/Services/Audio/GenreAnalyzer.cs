namespace Task5_MusicStore.Services.Audio;

public static class GenreAnalyzer
{
    private static readonly HashSet<string> GuitarGenres = new(StringComparer.OrdinalIgnoreCase)
    {
        "Rock", "Indie Rock", "Alternative", "Punk", "Metal",
        "Post-Rock", "Folk", "Country", "Blues", "Reggae",
        "Neue Deutsche Welle", "Volksmusik"
    };

    private static readonly HashSet<string> DrumGenres = new(StringComparer.OrdinalIgnoreCase)
    {
        "Rock", "Indie Rock", "Alternative", "Punk", "Metal",
        "Post-Rock", "Electronic", "Elektronik", "Synthwave",
        "Hip-Hop", "Funk", "Soul", "R&B"
    };

    public static string GetSamplerType(string genre)
    {
        if (string.IsNullOrEmpty(genre)) return "piano";
        return GuitarGenres.Contains(genre) ? "guitar" : "piano";
    }

    public static bool GetHasDrums(string genre)
    {
        if (string.IsNullOrEmpty(genre)) return false;
        return DrumGenres.Contains(genre);
    }

    public static (int min, int max) GetBpmRange(string genre)
    {
        if (string.IsNullOrEmpty(genre)) return (90, 110);

        var g = genre.ToLower();
        if (g.Contains("metal") || g.Contains("punk")) return (140, 180);
        if (g.Contains("electronic") || g.Contains("elektronik")) return (120, 150);
        if (g.Contains("synthwave")) return (110, 140);
        if (g.Contains("rock") || g.Contains("alternative")) return (100, 140);
        if (g.Contains("pop") || g.Contains("funk") || g.Contains("soul")) return (90, 120);
        if (g.Contains("jazz") || g.Contains("blues")) return (70, 100);
        if (g.Contains("classical") || g.Contains("klassik")) return (60, 90);
        if (g.Contains("ambient") || g.Contains("dream")) return (60, 80);
        if (g.Contains("folk") || g.Contains("country") || g.Contains("reggae")) return (80, 110);
        return (85, 120);
    }
}