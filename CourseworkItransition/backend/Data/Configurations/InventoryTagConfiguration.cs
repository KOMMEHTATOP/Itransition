using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApi.Data.Configurations;

public class InventoryTagConfiguration : IEntityTypeConfiguration<InventoryTag>
{
    public void Configure(EntityTypeBuilder<InventoryTag> builder)
    {
        builder.HasKey(t => new { t.InventoryId, t.TagName });
        builder.HasOne(t => t.Inventory)
            .WithMany(i => i.Tags)
            .HasForeignKey(t => t.InventoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}