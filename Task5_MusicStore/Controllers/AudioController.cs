using Microsoft.AspNetCore.Mvc;
using Task5_MusicStore.Services;

namespace Task5_MusicStore.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AudioController : ControllerBase
{
    private readonly AudioService _audio;

    public AudioController(AudioService audio)
    {
        _audio = audio;
    }

    [HttpGet]
    public IActionResult Get(
        [FromQuery] long seed = 12345,
        [FromQuery] string locale = "en-US",
        [FromQuery] int index = 1)
    {
        var track = _audio.Generate(seed, index);
        return Ok(track);
    }
}