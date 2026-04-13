using Microsoft.AspNetCore.Mvc;
using Task5_MusicStore.Services;

namespace Task5_MusicStore.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CoverController : ControllerBase
{
    private readonly SongGeneratorService _generator;
    private readonly CoverService _cover;

    public CoverController(SongGeneratorService generator, CoverService cover)
    {
        _generator = generator;
        _cover = cover;
    }

    [HttpGet]
    public IActionResult Get(
        [FromQuery] long seed = 12345,
        [FromQuery] string locale = "en-US",
        [FromQuery] int index = 1)
    {
        var songs = _generator.Generate(locale, seed, 1, index, 5);
        var song = songs.LastOrDefault();
        if (song == null) return NotFound();

        var png = _cover.GenerateCover(seed, index, song.Title, song.Artist);
        return File(png, "image/png");
    }
}