using InventoryApi.Models;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<Inventory> Inventories => Set<Inventory>();
    public DbSet<Item> Items => Set<Item>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<InventoryField> InventoryFields => Set<InventoryField>();
    public DbSet<ItemFieldValue> ItemFieldValues => Set<ItemFieldValue>();
    public DbSet<CustomIdElement> CustomIdElements => Set<CustomIdElement>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Category>(e =>
        {
            e.HasData(
                new Category { Id = 1, Name = "Equipment" },
                new Category { Id = 2, Name = "Furniture" },
                new Category { Id = 3, Name = "Book" },
                new Category { Id = 4, Name = "Other" }
            );
        });

        builder.Entity<Inventory>(e =>
        {
            e.HasOne(i => i.Owner)
             .WithMany(u => u.Inventories)
             .HasForeignKey(i => i.OwnerId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(i => i.Category)
             .WithMany(c => c.Inventories)
             .HasForeignKey(i => i.CategoryId)
             .OnDelete(DeleteBehavior.SetNull);

            e.Property(i => i.Version).IsConcurrencyToken();
        });

        builder.Entity<InventoryField>(e =>
        {
            e.HasOne(f => f.Inventory)
             .WithMany(i => i.Fields)
             .HasForeignKey(f => f.InventoryId)
             .OnDelete(DeleteBehavior.Cascade);
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

            e.HasIndex(i => new { i.InventoryId, i.CustomId }).IsUnique();
        });

        builder.Entity<CustomIdElement>(e =>
        {
            e.HasOne(el => el.Inventory)
             .WithMany(i => i.CustomIdElements)
             .HasForeignKey(el => el.InventoryId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<ItemFieldValue>(e =>
        {
            e.HasKey(v => new { v.ItemId, v.FieldId });

            e.HasOne(v => v.Item)
             .WithMany(i => i.FieldValues)
             .HasForeignKey(v => v.ItemId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(v => v.Field)
             .WithMany(f => f.FieldValues)
             .HasForeignKey(v => v.FieldId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
