using Bogus;
using System.Text.Json;
using Task5_MusicStore.Models;

namespace Task5_MusicStore.Services;

public class SongGeneratorService
{
    private readonly Dictionary<string, LocaleData> _locales = new();
    private readonly Dictionary<string, string> _bogusLocaleMap = new()
    {
        { "en-US", "en" },
        { "de-DE", "de" }
    };

    public SongGeneratorService(IWebHostEnvironment env)
    {
        var dataPath = Path.Combine(env.ContentRootPath, "Data");
        foreach (var file in Directory.GetFiles(dataPath, "*.json"))
        {
            var json = File.ReadAllText(file);
            var data = JsonSerializer.Deserialize<LocaleData>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
            if (data != null) 
                _locales[data.Locale] = data;
        }
    }

    public List<Song> Generate(string locale, long seed, int page, int pageSize, double likes)
    {
        if (!_locales.TryGetValue(locale, out var data))
            data = _locales.Values.First();

        var bogusLocale = _bogusLocaleMap.TryGetValue(locale, out var bl) ? bl : "en";
        var namePool = BuildNamePool(bogusLocale, seed);
        var bandPool = BuildBandPool(data, seed);

        long effectiveSeed = seed * 6364136223846793 + page;
        var songs = new List<Song>();

        for (int i = 0; i < pageSize; i++)
        {
            int globalIndex = (page - 1) * pageSize + i + 1;
            long recordSeed = effectiveSeed ^ (long)globalIndex;
            var rng = new Random((int)(recordSeed & 0x7FFFFFFF));
            var likesRng = new Random((int)((seed ^ globalIndex) & 0x7FFFFFFF));

            songs.Add(new Song
            {
                Index = globalIndex,
                Title = GenerateTitle(rng, data),
                Artist = rng.Next(2) == 0
                    ? namePool[rng.Next(namePool.Count)]
                    : bandPool[rng.Next(bandPool.Count)],
                Album = GenerateAlbum(rng, data),
                Genre = Pick(rng, data.Genres),
                Likes = GenerateLikes(likesRng, likes),
                Review = GenerateReview(rng, data, bogusLocale)
            });
        }

        return songs;
    }

    private List<string> BuildNamePool(string bogusLocale, long seed)
    {
        var faker = new Faker(bogusLocale) { Random = new Randomizer((int)(seed & 0x7FFFFFFF)) };
        var pool = new List<string>();
        for (int i = 0; i < 300; i++)
            pool.Add($"{faker.Name.FirstName()} {faker.Name.LastName()}");
        return pool;
    }

    private List<string> BuildBandPool(LocaleData data, long seed)
    {
        var rng = new Random((int)((seed ^ 987654321) & 0x7FFFFFFF));
        var pool = new List<string>();
        for (int i = 0; i < 150; i++)
            pool.Add($"{Pick(rng, data.BandPrefixes)} {Pick(rng, data.BandSuffixes)}");
        return pool;
    }

    private string GenerateTitle(Random rng, LocaleData data)
    {
        return rng.Next(4) switch
        {
            0 => $"{Pick(rng, data.MusicWords)} {Pick(rng, data.MusicWords)}",
            1 => Pick(rng, data.MusicWords),
            2 => $"{Pick(rng, data.MusicWords)} of {Pick(rng, data.MusicWords)}",
            _ => $"{Pick(rng, data.MusicWords)} & {Pick(rng, data.MusicWords)}"
        };
    }

    private string GenerateAlbum(Random rng, LocaleData data)
    {
        return rng.Next(4) switch
        {
            0 => "Single",
            1 => Pick(rng, data.MusicWords),
            2 => $"{Pick(rng, data.MusicWords)} {Pick(rng, data.MusicWords)}",
            _ => $"The {Pick(rng, data.MusicWords)}"
        };
    }

    private string GenerateReview(Random rng, LocaleData data, string bogusLocale)
    {
        var faker = new Faker(bogusLocale) { Random = new Randomizer(rng.Next()) };
        var opening = Pick(rng, data.ReviewPhrases);
        var closing = Pick(rng, data.ReviewPhrases);
        var middle = faker.Lorem.Sentence();
        return $"{opening}. {middle} {closing}.";
    }

    private int GenerateLikes(Random rng, double likes)
    {
        int baseLikes = (int)likes;
        double fraction = likes - baseLikes;
        int bonus = rng.NextDouble() < fraction ? 1 : 0;
        return baseLikes + bonus;
    }

    private string CapitalizeFirst(string input)
    {
        if (string.IsNullOrEmpty(input)) return input;
        return char.ToUpper(input[0]) + input[1..];
    }

    private T Pick<T>(Random rng, List<T> list) => list[rng.Next(list.Count)];
}