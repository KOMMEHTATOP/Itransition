using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApi.Data.Configurations;

public class ItemFieldValueConfiguration:IEntityTypeConfiguration<ItemFieldValue>
{
    public void Configure(EntityTypeBuilder<ItemFieldValue> builder)
    {
        builder.HasKey(v => new { v.ItemId, v.FieldId });

        builder.HasOne(v => v.Item)
            .WithMany(i => i.FieldValues)
            .HasForeignKey(v => v.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(v => v.Field)
            .WithMany(f => f.FieldValues)
            .HasForeignKey(v => v.FieldId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}