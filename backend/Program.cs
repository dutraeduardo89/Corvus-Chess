using Microsoft.EntityFrameworkCore;
using ChessApi.Data;
using ChessApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ChessDbContext>(options =>
    options.UseMySql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        ServerVersion.AutoDetect(builder.Configuration.GetConnectionString("DefaultConnection"))
    ));

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3002")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();
app.UseCors();

app.MapGet("/", () => "Corvus Chess API Rodando!");

app.MapPost("/games", async (ChessDbContext db) =>
{
    var game = new Game { Status = "Playing" };
    db.Games.Add(game);
    await db.SaveChangesAsync();
    return Results.Created($"/games/{game.Id}", game);
});

app.MapGet("/games/{id}", async (int id, ChessDbContext db) =>
{
    var game = await db.Games.FindAsync(id);
    return game is null ? Results.NotFound() : Results.Ok(game);
});

app.MapPut("/games/{id}", async (int id, UpdateGameDto input, ChessDbContext db) =>
{
    var game = await db.Games.FindAsync(id);
    if (game is null) return Results.NotFound();

    game.Fen = input.Fen;
    game.Status = input.Status;
    await db.SaveChangesAsync();
    return Results.Ok(game);
});

app.Run();

record UpdateGameDto(string Fen, string Status);
