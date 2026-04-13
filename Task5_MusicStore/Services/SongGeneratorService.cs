using System.Text.Json;
using Task5_MusicStore.Models;

namespace Task5_MusicStore.Services;

public class SongGeneratorService
{
    private readonly Dictionary<string, LocaleData> _locales = new();

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
                Artist = GenerateArtist(rng, data),
                Album = GenerateAlbum(rng, data),
                Genre = Pick(rng, data.Genres),
                Likes = GenerateLikes(likesRng, likes),
                Review = GenerateReview(rng, data)
            });
        }

        return songs;
    }

    private string GenerateTitle(Random rng, LocaleData data)
    {
        return rng.Next(3) switch
        {
            0 => $"{Pick(rng, data.TitleAdjectives)} {Pick(rng, data.TitleNouns)}",
            1 => $"{Pick(rng, data.TitleVerbs)} {Pick(rng, data.TitleNouns)}",
            _ => $"{Pick(rng, data.TitleAdjectives)} {Pick(rng, data.TitleVerbs)}"
        };
    }

    private string GenerateArtist(Random rng, LocaleData data)
    {
        if (rng.Next(2) == 0)
            return $"{Pick(rng, data.ArtistFirstNames)} {Pick(rng, data.ArtistLastNames)}";
        return $"{Pick(rng, data.BandPrefixes)} {Pick(rng, data.BandSuffixes)}";
    }

    private string GenerateAlbum(Random rng, LocaleData data)
    {
        if (rng.Next(4) == 0)
            return "Single";
        return $"{Pick(rng, data.AlbumWords)} {Pick(rng, data.AlbumWords)}";
    }

    private string GenerateReview(Random rng, LocaleData data)
    {
        var phrase1 = Pick(rng, data.ReviewPhrases);
        var phrase2 = Pick(rng, data.ReviewPhrases);
        return $"{phrase1}. {phrase2}.";
    }

    private int GenerateLikes(Random rng, double likes)
    {
        int baseLikes = (int)likes;
        double fraction = likes - baseLikes;
        int bonus = rng.NextDouble() < fraction ? 1 : 0;
        return baseLikes + bonus;
    }

    private T Pick<T>(Random rng, List<T> list) => list[rng.Next(list.Count)];
}