using InventoryApi.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<Item> Items => Set<Item>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Inventory>(e =>
        {
            e.HasOne(i => i.Owner)
             .WithMany(u => u.Inventories)
             .HasForeignKey(i => i.OwnerId)
             .OnDelete(DeleteBehavior.Cascade);

            e.Property(i => i.Version).IsConcurrencyToken();
        });

        builder.Entity<Item>(e =>
        {
            e.HasOne(i => i.Inventory)
             .WithMany(inv => inv.Items)
             .HasForeignKey(i => i.InventoryId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(i => i.Author)
             .WithMany()
             .HasForeignKey(i => i.AuthorId)
             .OnDelete(DeleteBehavior.Restrict);

            e.Property(i => i.Version).IsConcurrencyToken();
        });
    }
}
