using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApi.Data.Configurations;

public class ItemConfiguration :IEntityTypeConfiguration<Item>
{
    public void Configure(EntityTypeBuilder<Item> builder)
    {
        builder.HasOne(i => i.Inventory)
            .WithMany(inv => inv.Items)
            .HasForeignKey(i => i.InventoryId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Author)
            .WithMany()
            .HasForeignKey(i => i.AuthorId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Property(i => i.Version).IsConcurrencyToken();
        builder.Property(i => i.SearchVector).HasColumnType("tsvector");

        builder.HasIndex(i => new { i.InventoryId, i.CustomId }).IsUnique();
        builder.HasIndex(i => i.SearchVector).HasMethod("GIN");
    }
}