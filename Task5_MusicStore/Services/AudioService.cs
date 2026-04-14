using Task5_MusicStore.Models;
using Task5_MusicStore.Services.Audio;

namespace Task5_MusicStore.Services;

public class AudioService
{
    private static readonly int[][] VerseProgressions = {
        new[] { 0, 5, 3, 4 },
        new[] { 0, 3, 5, 3 },
        new[] { 0, 0, 3, 4 },
    };

    private static readonly int[][] ChorusProgressions = {
        new[] { 0, 3, 4, 0 },
        new[] { 5, 3, 0, 4 },
        new[] { 0, 4, 5, 3 },
    };

    public AudioTrack Generate(long seed, int index, string genre = "")
    {
        long trackSeed = seed ^ (long)index * 1234567891;
        var rng = new Random((int)(trackSeed & 0x7FFFFFFF));

        var (bpmMin, bpmMax) = GenreAnalyzer.GetBpmRange(genre);
        int bpm = rng.Next(bpmMin, bpmMax);
        string key = ScaleHelper.Keys[rng.Next(ScaleHelper.Keys.Length)];
        bool isMajor = rng.Next(3) != 0;
        int[] scale = isMajor ? ScaleHelper.MajorScale : ScaleHelper.MinorScale;
        string mode = isMajor ? "major" : "minor";
        int rootSemitone = Array.IndexOf(ScaleHelper.NoteNames, key);
        double beatDuration = 60.0 / bpm;

        var melody = new MelodyGenerator(rng);
        var verseProgression = VerseProgressions[rng.Next(VerseProgressions.Length)];
        var chorusProgression = ChorusProgressions[rng.Next(ChorusProgressions.Length)];

        var notes = new List<AudioNote>();
        double time = 0;
        int prevMelodySemitone = rootSemitone;

        var structure = new[]
        {
            (verseProgression, 4, false),
            (chorusProgression, 4, true),
            (verseProgression, 4, false),
            (chorusProgression, 4, true),
        };

        foreach (var (progression, bars, isChorus) in structure)
        {
            for (int bar = 0; bar < bars; bar++)
            {
                int chordDegree = progression[bar % progression.Length];
                int chordRootSemitone = (rootSemitone + scale[chordDegree]) % 12;
                int[] chordTones = ScaleHelper.GetChordTones(chordRootSemitone, scale);

                notes.AddRange(melody.GenerateBass(time, beatDuration, chordTones, chordRootSemitone));
                notes.AddRange(melody.GenerateChordStabs(time, beatDuration, chordTones, isChorus));
                notes.AddRange(melody.GenerateBar(time, beatDuration, chordTones, scale, rootSemitone, isChorus, ref prevMelodySemitone));

                time += 4 * beatDuration;
            }
        }

        return new AudioTrack
        {
            Bpm = bpm,
            Key = $"{key} {mode}",
            SamplerType = GenreAnalyzer.GetSamplerType(genre),
            HasDrums = GenreAnalyzer.GetHasDrums(genre),
            Index = index,
            Notes = notes.OrderBy(n => n.Time).ToList()
        };
    }
}