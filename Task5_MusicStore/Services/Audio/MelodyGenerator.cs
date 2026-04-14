using Task5_MusicStore.Models;

namespace Task5_MusicStore.Services.Audio;

public class MelodyGenerator
{
    private readonly Random _rng;

    public MelodyGenerator(Random rng)
    {
        _rng = rng;
    }

    public List<AudioNote> GenerateBar(
        double startTime,
        double beatDuration,
        int[] chordTones,
        int[] scale,
        int rootSemitone,
        bool isChorus,
        ref int prevMelodySemitone)
    {
        var notes = new List<AudioNote>();
        int beatsPerBar = 4;

        for (int beat = 0; beat < beatsPerBar; beat++)
        {
            if (beat == 3 && _rng.Next(3) == 0) continue;

            int octave = isChorus ? 5 : 4;
            int semitone = GetSmoothNote(chordTones, scale, rootSemitone, prevMelodySemitone);
            prevMelodySemitone = semitone;

            double dur = beat == 0 ? beatDuration * 1.5 : beatDuration * 0.5;

            notes.Add(new AudioNote
            {
                Note = ScaleHelper.GetNoteName(semitone, octave),
                Time = Math.Round(startTime + beat * beatDuration, 3),
                Duration = Math.Round(dur, 3),
                Instrument = "melody"
            });
        }

        return notes;
    }

    public List<AudioNote> GenerateBass(
        double startTime,
        double beatDuration,
        int[] chordTones,
        int chordRootSemitone)
    {
        return new List<AudioNote>
        {
            new AudioNote
            {
                Note = ScaleHelper.GetNoteName(chordRootSemitone, 2),
                Time = Math.Round(startTime, 3),
                Duration = Math.Round(beatDuration * 0.9, 3),
                Instrument = "bass"
            },
            new AudioNote
            {
                Note = ScaleHelper.GetNoteName(chordTones[2], 2),
                Time = Math.Round(startTime + beatDuration * 2, 3),
                Duration = Math.Round(beatDuration * 0.9, 3),
                Instrument = "bass"
            }
        };
    }

    public List<AudioNote> GenerateChordStabs(
        double startTime,
        double beatDuration,
        int[] chordTones,
        bool isChorus)
    {
        var notes = new List<AudioNote>();
        int octave = isChorus ? 4 : 3;
        double[] beats = isChorus
            ? new[] { 0.0, 1.0, 2.0, 3.0 }
            : new[] { 0.0, 2.0 };

        foreach (var beat in beats)
        {
            notes.Add(new AudioNote
            {
                Note = ScaleHelper.GetNoteName(chordTones[0], octave),
                Time = Math.Round(startTime + beat * beatDuration, 3),
                Duration = Math.Round(beatDuration * 0.4, 3),
                Instrument = "chord"
            });
        }

        return notes;
    }

    private int GetSmoothNote(int[] chordTones, int[] scale, int rootSemitone, int prev)
    {
        var scaleNotes = ScaleHelper.GetScaleNotes(scale, rootSemitone);
        int prevIdx = scaleNotes.IndexOf(prev % 12);
        if (prevIdx < 0) prevIdx = 0;

        int step = _rng.Next(-2, 3);
        int nextIdx = Math.Clamp(prevIdx + step, 0, scaleNotes.Count - 1);

        if (_rng.Next(10) < 6)
            return chordTones[_rng.Next(chordTones.Length)];

        return scaleNotes[nextIdx];
    }
}