namespace Task5_MusicStore.Services;

public class LocaleData
{
    public string Locale { get; set; } = "";
    public List<string> ArtistFirstNames { get; set; } = new();
    public List<string> ArtistLastNames { get; set; } = new();
    public List<string> BandPrefixes { get; set; } = new();
    public List<string> BandSuffixes { get; set; } = new();
    public List<string> TitleAdjectives { get; set; } = new();
    public List<string> TitleNouns { get; set; } = new();
    public List<string> TitleVerbs { get; set; } = new();
    public List<string> AlbumWords { get; set; } = new();
    public List<string> Genres { get; set; } = new();
    public List<string> ReviewPhrases { get; set; } = new();
}