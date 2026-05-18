using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApi.Data.Configurations;

public class InventoryFieldConfiguration :IEntityTypeConfiguration<InventoryField>
{
    public void Configure(EntityTypeBuilder<InventoryField> builder)
    {
        builder.HasOne(f => f.Inventory)
            .WithMany(i => i.Fields)
            .HasForeignKey(f => f.InventoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}