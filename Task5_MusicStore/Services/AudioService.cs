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
    public string SamplerType { get; set; } = "piano";
    public int Index { get; set; }
    public bool HasDrums { get; set; }
    public List<AudioNote> Notes { get; set; } = new();
}

public class AudioService
{
    private static readonly string[] Keys = { "C", "D", "E", "F", "G", "A" };
    private static readonly string[] NoteNames = {
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
    };

    private static readonly int[] MajorScale = { 0, 2, 4, 5, 7, 9, 11 };
    private static readonly int[] MinorScale = { 0, 2, 3, 5, 7, 8, 10 };

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

    private static readonly HashSet<string> GuitarGenres = new(StringComparer.OrdinalIgnoreCase)
    {
        "Rock", "Indie Rock", "Alternative", "Punk", "Metal",
        "Post-Rock", "Folk", "Country", "Blues", "Reggae",
        "Neue Deutsche Welle", "Volksmusik"
    };

    private static readonly HashSet<string> PianoGenres = new(StringComparer.OrdinalIgnoreCase)
    {
        "Jazz", "Classical", "Soul", "R&B", "Ambient",
        "Dream Pop", "Synthwave", "Electronic", "Funk",
        "Schlager", "Elektronik", "Klassik"
    };

    public AudioTrack Generate(long seed, int index, string genre = "")
    {
        long trackSeed = seed ^ (long)index * 1234567891;
        var rng = new Random((int)(trackSeed & 0x7FFFFFFF));

        var (bpmMin, bpmMax) = GetBpmRange(genre);
        int bpm = rng.Next(bpmMin, bpmMax);
        string key = Keys[rng.Next(Keys.Length)];
        bool isMajor = rng.Next(3) != 0;
        int[] scale = isMajor ? MajorScale : MinorScale;
        string mode = isMajor ? "major" : "minor";
        string samplerType = GetSamplerType(genre);

        int rootSemitone = Array.IndexOf(NoteNames, key);
        double beatDuration = 60.0 / bpm;

        var verseProgression = VerseProgressions[rng.Next(VerseProgressions.Length)];
        var chorusProgression = ChorusProgressions[rng.Next(ChorusProgressions.Length)];

        var notes = new List<AudioNote>();
        double time = 0;

        var structure = new[] {
            (verseProgression, 4, false),
            (chorusProgression, 4, true),
            (verseProgression, 4, false),
            (chorusProgression, 4, true),
        };

        int prevMelodySemitone = rootSemitone;

        foreach (var (progression, bars, isChorus) in structure)
        {
            for (int bar = 0; bar < bars; bar++)
            {
                int chordDegree = progression[bar % progression.Length];
                int chordRootSemitone = (rootSemitone + scale[chordDegree]) % 12;
                int[] chordTones = GetChordTones(chordRootSemitone, scale, rootSemitone);

                // Bass
                notes.Add(new AudioNote
                {
                    Note = GetNoteName(chordRootSemitone, 2),
                    Time = Math.Round(time, 3),
                    Duration = Math.Round(beatDuration * 0.9, 3),
                    Instrument = "bass"
                });
                notes.Add(new AudioNote
                {
                    Note = GetNoteName(chordTones[2], 2),
                    Time = Math.Round(time + beatDuration * 2, 3),
                    Duration = Math.Round(beatDuration * 0.9, 3),
                    Instrument = "bass"
                });

                // Chord stabs
                int chordOctave = isChorus ? 4 : 3;
                double[] chordBeats = isChorus
                    ? new[] { 0.0, 1.0, 2.0, 3.0 }
                    : new[] { 0.0, 2.0 };

                foreach (var beat in chordBeats)
                {
                    notes.Add(new AudioNote
                    {
                        Note = GetNoteName(chordTones[0], chordOctave),
                        Time = Math.Round(time + beat * beatDuration, 3),
                        Duration = Math.Round(beatDuration * 0.4, 3),
                        Instrument = "chord"
                    });
                }

                // Melody
                int beatsPerBar = 4;
                for (int beat = 0; beat < beatsPerBar; beat++)
                {
                    if (beat == 3 && rng.Next(3) == 0) continue;

                    int melodyOctave = isChorus ? 5 : 4;
                    int nextSemitone = GetSmoothMelodyNote(rng, prevMelodySemitone, chordTones, scale, rootSemitone);
                    prevMelodySemitone = nextSemitone;

                    double dur = beat == 0 ? beatDuration * 1.5 : beatDuration * 0.5;

                    notes.Add(new AudioNote
                    {
                        Note = GetNoteName(nextSemitone, melodyOctave),
                        Time = Math.Round(time + beat * beatDuration, 3),
                        Duration = Math.Round(dur, 3),
                        Instrument = "melody"
                    });
                }

                time += beatsPerBar * beatDuration;
            }
        }

        return new AudioTrack
        {
            Bpm = bpm,
            Key = $"{key} {mode}",
            SamplerType = samplerType,
            Index = index,
            HasDrums = GetHasDrums(genre),
            Notes = notes.OrderBy(n => n.Time).ToList()
        };
    }

    private string GetSamplerType(string genre)
    {
        if (string.IsNullOrEmpty(genre)) return "piano";
        if (GuitarGenres.Contains(genre)) return "guitar";
        if (PianoGenres.Contains(genre)) return "piano";
        return "piano";
    }
    
    private bool GetHasDrums(string genre)
    {
        if (string.IsNullOrEmpty(genre)) return false;
        var g = genre.ToLower();
        return g.Contains("rock") || g.Contains("metal") || g.Contains("punk") ||
               g.Contains("electronic") || g.Contains("elektronik") ||
               g.Contains("synthwave") || g.Contains("hip") ||
               g.Contains("funk") || g.Contains("soul") || g.Contains("r&b");
    }
    
    private (int min, int max) GetBpmRange(string genre)
    {
        if (string.IsNullOrEmpty(genre)) return (90, 110);

        return genre.ToLower() switch
        {
            var g when g.Contains("metal") || g.Contains("punk") => (140, 180),
            var g when g.Contains("electronic") || g.Contains("elektronik") => (120, 150),
            var g when g.Contains("synthwave") => (110, 140),
            var g when g.Contains("rock") || g.Contains("alternative") => (100, 140),
            var g when g.Contains("pop") || g.Contains("funk") || g.Contains("soul") => (90, 120),
            var g when g.Contains("jazz") || g.Contains("blues") => (70, 100),
            var g when g.Contains("classical") || g.Contains("klassik") => (60, 90),
            var g when g.Contains("ambient") || g.Contains("dream") => (60, 80),
            var g when g.Contains("folk") || g.Contains("country") || g.Contains("reggae") => (80, 110),
            _ => (85, 120)
        };
    }

    private int GetSmoothMelodyNote(Random rng, int prev, int[] chordTones, int[] scale, int root)
    {
        var scaleNotes = scale.Select(s => (root + s) % 12).ToList();
        int prevIdx = scaleNotes.IndexOf(prev % 12);
        if (prevIdx < 0) prevIdx = 0;
        int step = rng.Next(-2, 3);
        int nextIdx = Math.Clamp(prevIdx + step, 0, scaleNotes.Count - 1);
        if (rng.Next(10) < 6)
            return chordTones[rng.Next(chordTones.Length)];
        return scaleNotes[nextIdx];
    }

    private int[] GetChordTones(int chordRoot, int[] scale, int rootSemitone)
    {
        int root = chordRoot % 12;
        int third = (chordRoot + (scale.Length > 2 ? scale[2] - scale[0] : 4)) % 12;
        int fifth = (chordRoot + (scale.Length > 4 ? scale[4] - scale[0] : 7)) % 12;
        return new[] { root, third, fifth };
    }

    private string GetNoteName(int semitone, int octave)
    {
        return $"{NoteNames[((semitone % 12) + 12) % 12]}{octave}";
    }
}