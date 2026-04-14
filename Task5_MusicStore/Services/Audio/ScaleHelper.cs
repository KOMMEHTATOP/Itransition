namespace Task5_MusicStore.Services.Audio;

public static class ScaleHelper
{
    public static readonly int[] MajorScale = { 0, 2, 4, 5, 7, 9, 11 };
    public static readonly int[] MinorScale = { 0, 2, 3, 5, 7, 8, 10 };

    public static readonly string[] NoteNames = {
        "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"
    };

    public static readonly string[] Keys = { "C", "D", "E", "F", "G", "A" };

    public static int[] GetChordTones(int chordRoot, int[] scale)
    {
        int root = chordRoot % 12;
        int third = (chordRoot + (scale.Length > 2 ? scale[2] - scale[0] : 4)) % 12;
        int fifth = (chordRoot + (scale.Length > 4 ? scale[4] - scale[0] : 7)) % 12;
        return new[] { root, third, fifth };
    }

    public static string GetNoteName(int semitone, int octave)
    {
        return $"{NoteNames[((semitone % 12) + 12) % 12]}{octave}";
    }

    public static List<int> GetScaleNotes(int[] scale, int rootSemitone)
    {
        return scale.Select(s => (rootSemitone + s) % 12).ToList();
    }
}