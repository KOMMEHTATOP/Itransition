using Microsoft.AspNetCore.Mvc;
using Task5_MusicStore.Services.Lyrics;

namespace Task5_MusicStore.Controllers;

[ApiController]
[Route("api/[controller]")]
public class LyricsController : ControllerBase
{
    private readonly LyricsGenerator _generator;

    public LyricsController(LyricsGenerator generator)
    {
        _generator = generator;
    }

    [HttpGet]
    public IActionResult Get(
        [FromQuery] long seed = 12345,
        [FromQuery] int index = 1,
        [FromQuery] string locale = "en-US",
        [FromQuery] double duration = 30)
    {
        var lines = _generator.Generate(seed, index, locale, duration);
        return Ok(lines);
    }
}