using Microsoft.EntityFrameworkCore;
using Task3_AdminPlatform.Models;

namespace Task3_AdminPlatform.Data;

public class ApplicationDbContext:DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
        
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.Entity<User>()
            .HasIndex(x => x.Email)
            .IsUnique();
    }
    
    
    public DbSet<User> Users { get; set; }
    
}