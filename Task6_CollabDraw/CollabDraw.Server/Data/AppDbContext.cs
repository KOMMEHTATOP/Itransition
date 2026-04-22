using Microsoft.EntityFrameworkCore;
using CollabDraw.Server.Models;

namespace CollabDraw.Server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Board> Boards => Set<Board>();
    public DbSet<Page> Pages => Set<Page>();
    public DbSet<Element> Elements => Set<Element>();
    public DbSet<BoardUser> BoardUsers => Set<BoardUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // User
        modelBuilder.Entity<User>(e =>
        {
            e.HasIndex(u => u.Token).IsUnique();
            e.Property(u => u.DisplayName).HasMaxLength(30);
        });

        // Board
        modelBuilder.Entity<Board>(e =>
        {
            e.Property(b => b.Name).HasMaxLength(100);
            e.HasOne(b => b.CreatedBy)
                .WithMany(u => u.CreatedBoards)
                .HasForeignKey(b => b.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // Page
        modelBuilder.Entity<Page>(e =>
        {
            e.Property(p => p.Title).HasMaxLength(100);
            e.HasOne(p => p.Board)
                .WithMany(b => b.Pages)
                .HasForeignKey(p => p.BoardId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Element
        modelBuilder.Entity<Element>(e =>
        {
            e.Property(el => el.Type).HasMaxLength(50);
            e.Property(el => el.Properties).HasColumnType("jsonb");
            e.HasOne(el => el.Page)
                .WithMany(p => p.Elements)
                .HasForeignKey(el => el.PageId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(el => el.CreatedBy)
                .WithMany()
                .HasForeignKey(el => el.CreatedById)
                .OnDelete(DeleteBehavior.Restrict);
            e.HasIndex(el => new { el.PageId, el.IsDeleted });
        });

        // BoardUser
        modelBuilder.Entity<BoardUser>(e =>
        {
            e.HasIndex(bu => new { bu.BoardId, bu.UserId }).IsUnique();
            e.Property(bu => bu.Role).HasConversion<string>().HasMaxLength(20);
            e.HasOne(bu => bu.Board)
                .WithMany(b => b.BoardUsers)
                .HasForeignKey(bu => bu.BoardId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(bu => bu.User)
                .WithMany(u => u.BoardUsers)
                .HasForeignKey(bu => bu.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}