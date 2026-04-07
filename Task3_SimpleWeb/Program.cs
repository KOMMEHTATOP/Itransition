var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/{*path}", (HttpContext ctx) =>
{
    var query = ctx.Request.Query;

    if (!query.TryGetValue("x", out var xStr) || !query.TryGetValue("y", out var yStr))
        return Results.Text("NaN");

    if (!ulong.TryParse(xStr, out var x) || !ulong.TryParse(yStr, out var y))
        return Results.Text("NaN");

    if (x == 0 || y == 0)
        return Results.Text("0");

    var lcm = x / Gcd(x, y) * y;
    return Results.Text(lcm.ToString());
});

app.Run();

static ulong Gcd(ulong a, ulong b)
{
    while (b != 0) { var t = b; b = a % b; a = t; }
    return a;
}