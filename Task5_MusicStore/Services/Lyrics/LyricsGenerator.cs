using System.Text.Json;
using Task5_MusicStore.Models;

namespace Task5_MusicStore.Services.Lyrics;

public class LyricsGenerator
{
    private readonly Dictionary<string, LyricsLocaleData> _locales = new();

    public LyricsGenerator(IWebHostEnvironment env)
    {
        var dataPath = Path.Combine(env.ContentRootPath, "Data");
        foreach (var file in Directory.GetFiles(dataPath, "*.json"))
        {
            var json = File.ReadAllText(file);
            var data = JsonSerializer.Deserialize<LyricsLocaleData>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            if (data != null && !string.IsNullOrEmpty(data.Locale))
                _locales[data.Locale] = data;
        }
    }

    public List<LyricsLine> Generate(long seed, int index, string locale, double totalDuration)
    {
        if (!_locales.TryGetValue(locale, out var data))
            data = _locales.Values.First();

        long lyricsSeed = seed ^ (long)index * 987654321;
        var rng = new Random((int)(lyricsSeed & 0x7FFFFFFF));

        var lines = new List<LyricsLine>();
        int lineCount = rng.Next(8, 16);
        double timePerLine = totalDuration / lineCount;

        for (int i = 0; i < lineCount; i++)
        {
            string text = GenerateLine(rng, data);
            lines.Add(new LyricsLine
            {
                Text = text,
                StartTime = Math.Round(i * timePerLine, 2),
                EndTime = Math.Round((i + 1) * timePerLine, 2)
            });
        }

        return lines;
    }

    private string GenerateLine(Random rng, LyricsLocaleData data)
    {
        var template = Pick(rng, data.LyricsTemplates);
        string verb = Pick(rng, data.LyricsVerbs);
        string noun = Pick(rng, data.LyricsNouns);
        string adjective = Pick(rng, data.LyricsAdjectives);

        return template
            .Replace("{verb}", verb)
            .Replace("{noun}", noun)
            .Replace("{adjective}", adjective);
    }

    private T Pick<T>(Random rng, List<T> list) => list[rng.Next(list.Count)];
}

public class LyricsLocaleData
{
    public string Locale { get; set; } = "";
    public List<string> LyricsVerbs { get; set; } = new();
    public List<string> LyricsNouns { get; set; } = new();
    public List<string> LyricsAdjectives { get; set; } = new();
    public List<string> LyricsTemplates { get; set; } = new();
}