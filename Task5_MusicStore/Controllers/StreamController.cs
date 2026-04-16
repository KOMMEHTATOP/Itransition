using Microsoft.AspNetCore.Mvc;
using Task5_MusicStore.Services;
using Task5_MusicStore.Services.Audio;

namespace Task5_MusicStore.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StreamController : ControllerBase
{
    private readonly AudioService _audioService;
    private readonly Mp3GeneratorService _mp3Generator;

    public StreamController(AudioService audioService, Mp3GeneratorService mp3Generator)
    {
        _audioService = audioService;
        _mp3Generator = mp3Generator;
    }

    [HttpGet]
    public IActionResult Get(
        [FromQuery] long seed = 12345,
        [FromQuery] string locale = "en-US",
        [FromQuery] int index = 1,
        [FromQuery] string genre = "")
    {
        var track = _audioService.Generate(seed, index, genre);
        var mp3 = _mp3Generator.GenerateMp3(track);

        var rangeHeader = Request.Headers["Range"].ToString();
        if (!string.IsNullOrEmpty(rangeHeader))
        {
            return HandleRangeRequest(mp3, rangeHeader);
        }

        Response.Headers["Accept-Ranges"] = "bytes";
        return File(mp3, "audio/mpeg");
    }

    [HttpGet("download")]
    public IActionResult Download(
        [FromQuery] long seed = 12345,
        [FromQuery] string locale = "en-US",
        [FromQuery] int index = 1,
        [FromQuery] string genre = "",
        [FromQuery] string title = "track",
        [FromQuery] string artist = "artist",
        [FromQuery] string album = "album")
    {
        var track = _audioService.Generate(seed, index, genre);
        var mp3 = _mp3Generator.GenerateMp3(track);

        var fileName = $"{SanitizeFileName(title)} - {SanitizeFileName(artist)} - {SanitizeFileName(album)}.mp3";
        return File(mp3, "audio/mpeg", fileName);
    }

    private IActionResult HandleRangeRequest(byte[] data, string rangeHeader)
    {
        var totalLength = data.Length;

        // Парсим Range: bytes=start-end
        var range = rangeHeader.Replace("bytes=", "").Split('-');
        long start = long.Parse(range[0]);
        long end = range[1].Length > 0 ? long.Parse(range[1]) : totalLength - 1;
        end = Math.Min(end, totalLength - 1);
        long length = end - start + 1;

        Response.Headers["Accept-Ranges"] = "bytes";
        Response.Headers["Content-Range"] = $"bytes {start}-{end}/{totalLength}";
        Response.Headers["Content-Length"] = length.ToString();
        Response.StatusCode = 206;

        var segment = new byte[length];
        Array.Copy(data, start, segment, 0, length);
        return File(segment, "audio/mpeg");
    }

    private string SanitizeFileName(string name)
    {
        var invalid = Path.GetInvalidFileNameChars();
        return string.Concat(name.Select(c => invalid.Contains(c) ? '_' : c));
    }
}