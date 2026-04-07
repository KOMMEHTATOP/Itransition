using System.Numerics;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.MapGet("/{*path}", (HttpContext ctx) =>
{
    var query = ctx.Request.Query;

    if (!query.TryGetValue("x", out var xStr) || !query.TryGetValue("y", out var yStr))
        return Results.Text("NaN");

    if (!BigInteger.TryParse(xStr, out var x) || !BigInteger.TryParse(yStr, out var y))
        return Results.Text("NaN");

    if (x <= 0 || y <= 0)
        return Results.Text("NaN");

    var lcm = x / BigInteger.GreatestCommonDivisor(x, y) * y;
    return Results.Text(lcm.ToString());
});

app.Run();