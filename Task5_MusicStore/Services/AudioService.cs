namespace Task5_MusicStore.Services;

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
    public List<AudioNote> Notes { get; set; } = new();
}

public class AudioService
{
    private static readonly string[] Keys = { "C", "D", "E", "F", "G", "A", "B" };
    private static readonly string[] Modes = { "major", "minor" };

    // Intervals for major and minor scales (semitones from root)
    private static readonly int[] MajorScale = { 0, 2, 4, 5, 7, 9, 11 };
    private static readonly int[] MinorScale = { 0, 2, 3, 5, 7, 8, 10 };

    // Common chord progressions (indices into scale)
    private static readonly int[][] Progressions = {
        new[] { 0, 3, 4, 0 },   // I-IV-V-I
        new[] { 0, 5, 3, 4 },   // I-vi-IV-V
        new[] { 0, 3, 0, 4 },   // I-IV-I-V
        new[] { 5, 3, 0, 4 },   // vi-IV-I-V
    };

    // Note names by semitone
    private static readonly string[] NoteNames = {
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
    };

    public AudioTrack Generate(long seed, int index)
    {
        long trackSeed = seed ^ (long)index * 1234567891;
        var rng = new Random((int)(trackSeed & 0x7FFFFFFF));

        int bpm = rng.Next(75, 135);
        string key = Keys[rng.Next(Keys.Length)];
        string mode = Modes[rng.Next(Modes.Length)];
        int[] scale = mode == "major" ? MajorScale : MinorScale;
        int[] progression = Progressions[rng.Next(Progressions.Length)];

        int rootSemitone = Array.IndexOf(NoteNames, key);
        double beatDuration = 60.0 / bpm;
        int totalBars = 8;
        int beatsPerBar = 4;

        var notes = new List<AudioNote>();
        double time = 0;

        for (int bar = 0; bar < totalBars; bar++)
        {
            int chordRoot = scale[progression[bar % progression.Length]];
            int[] chordTones = GetChordTones(chordRoot, scale, rootSemitone);

            // Bass note on beat 1
            notes.Add(new AudioNote
            {
                Note = GetNoteName(chordTones[0], 2),
                Time = Math.Round(time, 3),
                Duration = Math.Round(beatDuration * 2, 3),
                Instrument = "bass"
            });

            // Melody notes
            for (int beat = 0; beat < beatsPerBar; beat++)
            {
                double noteTime = time + beat * beatDuration;
                bool isLong = rng.Next(3) == 0;
                double dur = isLong ? beatDuration * 1.5 : beatDuration * 0.75;

                // Pick melody note from chord tones + passing tones
                int semitone = rng.Next(2) == 0
                    ? chordTones[rng.Next(chordTones.Length)]
                    : (rootSemitone + scale[rng.Next(scale.Length)]) % 12;

                int octave = rng.Next(2) == 0 ? 4 : 5;

                notes.Add(new AudioNote
                {
                    Note = GetNoteName(semitone, octave),
                    Time = Math.Round(noteTime, 3),
                    Duration = Math.Round(dur, 3),
                    Instrument = "melody"
                });

                // Chord stab on beat 1 and 3
                if (beat == 0 || beat == 2)
                {
                    foreach (var tone in chordTones.Take(3))
                    {
                        notes.Add(new AudioNote
                        {
                            Note = GetNoteName(tone, 4),
                            Time = Math.Round(noteTime, 3),
                            Duration = Math.Round(beatDuration * 0.5, 3),
                            Instrument = "chord"
                        });
                    }
                }
            }

            time += beatsPerBar * beatDuration;
        }

        return new AudioTrack
        {
            Bpm = bpm,
            Key = $"{key} {mode}",
            Notes = notes.OrderBy(n => n.Time).ToList()
        };
    }

    private int[] GetChordTones(int rootInterval, int[] scale, int rootSemitone)
    {
        // Triad: root, third, fifth from scale
        int root = (rootSemitone + rootInterval) % 12;
        int third = (rootSemitone + scale[Math.Min(2, scale.Length - 1)]) % 12;
        int fifth = (rootSemitone + scale[Math.Min(4, scale.Length - 1)]) % 12;
        return new[] { root, third, fifth };
    }

    private string GetNoteName(int semitone, int octave)
    {
        return $"{NoteNames[semitone % 12]}{octave}";
    }
}