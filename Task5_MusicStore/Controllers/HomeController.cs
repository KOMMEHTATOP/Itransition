using Microsoft.AspNetCore.Mvc;

namespace Task5_MusicStore.Controllers;

public class HomeController : Controller
{
    public IActionResult Index()
    {
        return View();
    }
}