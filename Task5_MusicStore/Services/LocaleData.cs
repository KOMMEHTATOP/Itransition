namespace Task5_MusicStore.Services;

public class LocaleData
{
    public string Locale { get; set; } = "";
    public List<string> MusicWords { get; set; } = new();
    public List<string> BandPrefixes { get; set; } = new();
    public List<string> BandSuffixes { get; set; } = new();
    public List<string> Genres { get; set; } = new();
    public List<string> ReviewPhrases { get; set; } = new();
}