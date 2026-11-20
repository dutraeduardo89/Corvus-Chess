using Microsoft.EntityFrameworkCore;
using ChessApi.Models;

namespace ChessApi.Data;

public class ChessDbContext : DbContext
{
    public ChessDbContext(DbContextOptions<ChessDbContext> options) : base(options) { }
    public DbSet<Game> Games => Set<Game>();
}