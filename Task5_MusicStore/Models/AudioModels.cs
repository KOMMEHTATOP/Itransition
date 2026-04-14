namespace Task5_MusicStore.Models;

public class AudioNote
{
    public string Note { get; set; } = "";
    public double Time { get; set; }
    public double Duration { get; set; }
    public string Instrument { get; set; } = "synth";
}

public class AudioTrack
{
    public int Bpm { get; set; }
    public string Key { get; set; } = "";
    public string SamplerType { get; set; } = "piano";
    public int Index { get; set; }
    public bool HasDrums { get; set; }
    public List<AudioNote> Notes { get; set; } = new();
}