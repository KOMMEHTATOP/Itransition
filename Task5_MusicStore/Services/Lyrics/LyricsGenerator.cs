using Bogus;
using Task5_MusicStore.Models;

namespace Task5_MusicStore.Services.Lyrics;

public class LyricsGenerator
{
    private static readonly Dictionary<string, string> LocaleMap = new()
    {
        ["en-US"] = "en",
        ["de-DE"] = "de"
    };

    public List<LyricsLine> Generate(long seed, int index, string locale, double totalDuration)
    {
        var bogusLocale = LocaleMap.TryGetValue(locale, out var bl) ? bl : "en";

        long lyricsSeed = seed ^ (long)index * 987654321;
        var rng = new Random((int)(lyricsSeed & 0x7FFFFFFF));
        var faker = new Faker(bogusLocale) { Random = new Randomizer((int)(lyricsSeed & 0x7FFFFFFF)) };

        var lines = new List<LyricsLine>();
        int lineCount = rng.Next(8, 16);
        double timePerLine = totalDuration / lineCount;

        for (int i = 0; i < lineCount; i++)
        {
            string text = GenerateLine(faker, rng);
            lines.Add(new LyricsLine
            {
                Text = text,
                StartTime = Math.Round(i * timePerLine, 2),
                EndTime = Math.Round((i + 1) * timePerLine, 2)
            });
        }

        return lines;
    }

    private string GenerateLine(Faker faker, Random rng)
    {
        return rng.Next(3) switch
        {
            0 => faker.Lorem.Sentence(rng.Next(3, 6)),
            1 => $"{faker.Hacker.IngVerb()} {faker.Hacker.Adjective()} {faker.Hacker.Noun()}",
            _ => $"{faker.Lorem.Word()} {faker.Hacker.Noun()} {faker.Lorem.Word()}"
        };
    }
}