using MeltySynth;
using NAudio.Wave;
using NAudio.Lame;
using Task5_MusicStore.Models;

namespace Task5_MusicStore.Services.Audio;

public class Mp3GeneratorService
{
    private readonly string _soundFontPath;
    private const int SampleRate = 44100;

    public Mp3GeneratorService(IWebHostEnvironment env)
    {
        _soundFontPath = Path.Combine(env.ContentRootPath, "Data", "TimGM6mb.sf2");
    }

    public byte[] GenerateMp3(AudioTrack track)
    {
        var left = new float[(int)(SampleRate * (track.Notes.Max(n => n.Time + n.Duration) + 1))];
        var right = new float[left.Length];

        var synthesizer = new Synthesizer(_soundFontPath, SampleRate);

        int instrument = track.SamplerType == "guitar" ? 25 : 0;
        synthesizer.ProcessMidiMessage(0, 0xC0, instrument, 0);

        int blockSize = SampleRate / 100; 
        double currentTime = 0;
        double timePerBlock = (double)blockSize / SampleRate;
        int totalBlocks = left.Length / blockSize;

        var noteEvents = BuildNoteEvents(track.Notes);
        int eventIndex = 0;

        for (int block = 0; block < totalBlocks; block++)
        {
            while (eventIndex < noteEvents.Count && noteEvents[eventIndex].Time <= currentTime)
            {
                var ev = noteEvents[eventIndex];
                if (ev.IsNoteOn)
                    synthesizer.NoteOn(0, ev.MidiNote, ev.Velocity);
                else
                    synthesizer.NoteOff(0, ev.MidiNote);
                eventIndex++;
            }

            var leftBlock = new float[blockSize];
            var rightBlock = new float[blockSize];
            synthesizer.Render(leftBlock, rightBlock);

            Array.Copy(leftBlock, 0, left, block * blockSize, blockSize);
            Array.Copy(rightBlock, 0, right, block * blockSize, blockSize);

            currentTime += timePerBlock;
        }

        return ConvertToMp3(left, right);
    }

    private List<NoteEvent> BuildNoteEvents(List<AudioNote> notes)
    {
        var events = new List<NoteEvent>();
        foreach (var note in notes)
        {
            int midiNote = NoteNameToMidi(note.Note);
            if (midiNote < 0) continue;

            events.Add(new NoteEvent { Time = note.Time, MidiNote = midiNote, IsNoteOn = true, Velocity = 80 });
            events.Add(new NoteEvent { Time = note.Time + note.Duration, MidiNote = midiNote, IsNoteOn = false, Velocity = 0 });
        }
        return events.OrderBy(e => e.Time).ToList();
    }

    private int NoteNameToMidi(string noteName)
    {
        var noteMap = new Dictionary<string, int>
        {
            {"C", 0}, {"C#", 1}, {"D", 2}, {"D#", 3}, {"E", 4}, {"F", 5},
            {"F#", 6}, {"G", 7}, {"G#", 8}, {"A", 9}, {"A#", 10}, {"B", 11}
        };

        int octaveStart = noteName.Length - 1;
        while (octaveStart > 0 && (char.IsDigit(noteName[octaveStart]) || noteName[octaveStart] == '-'))
            octaveStart--;

        string pitchName = noteName.Substring(0, octaveStart + 1);
        if (!int.TryParse(noteName.Substring(octaveStart + 1), out int octave)) return -1;
        if (!noteMap.TryGetValue(pitchName, out int semitone)) return -1;

        return (octave + 1) * 12 + semitone;
    }

    private byte[] ConvertToMp3(float[] left, float[] right)
    {
        using var ms = new MemoryStream();
        using var writer = new LameMP3FileWriter(ms, new WaveFormat(SampleRate, 2), 128);

        var buffer = new byte[left.Length * 4];
        for (int i = 0; i < left.Length; i++)
        {
            short leftSample = (short)(Math.Clamp(left[i], -1f, 1f) * 32767);
            short rightSample = (short)(Math.Clamp(right[i], -1f, 1f) * 32767);
            BitConverter.GetBytes(leftSample).CopyTo(buffer, i * 4);
            BitConverter.GetBytes(rightSample).CopyTo(buffer, i * 4 + 2);
        }

        writer.Write(buffer, 0, buffer.Length);
        writer.Flush();
        return ms.ToArray();
    }

    private class NoteEvent
    {
        public double Time { get; set; }
        public int MidiNote { get; set; }
        public bool IsNoteOn { get; set; }
        public int Velocity { get; set; }
    }
}