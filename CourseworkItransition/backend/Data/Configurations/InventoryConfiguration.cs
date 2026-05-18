using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApi.Data.Configurations;

public class InventoryConfiguration : IEntityTypeConfiguration<Inventory>
{
    public void Configure(EntityTypeBuilder<Inventory> builder)
    {
        builder.HasOne(i => i.Owner)
            .WithMany(u => u.Inventories)
            .HasForeignKey(i => i.OwnerId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Category)
            .WithMany(c => c.Inventories)
            .HasForeignKey(i => i.CategoryId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.Property(i => i.Version).IsConcurrencyToken();

        builder.HasGeneratedTsVectorColumn(
                i => i.SearchVector!,
                "english",
                i => new { i.Title, i.Description })
            .HasIndex(i => i.SearchVector)
            .HasMethod("GIN");
    }
}