using Microsoft.AspNetCore.Mvc;
using Task5_MusicStore.Services;

namespace Task5_MusicStore.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SongsController : ControllerBase
{
    private readonly SongGeneratorService _generator;

    public SongsController(SongGeneratorService generator)
    {
        _generator = generator;
    }

    [HttpGet]
    public IActionResult Get(
        [FromQuery] string locale = "en-US",
        [FromQuery] long seed = 12345,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] double likes = 5)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 100) pageSize = 20;

        var songs = _generator.Generate(locale, seed, page, pageSize, likes);

        return Ok(new
        {
            page,
            pageSize,
            songs
        });
    }
}