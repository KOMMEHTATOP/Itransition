using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApi.Data.Configurations;

public class CustomIdElementConfiguration :IEntityTypeConfiguration<CustomIdElement>
{
    public void Configure(EntityTypeBuilder<CustomIdElement> builder)
    {
        builder.HasOne(el => el.Inventory)
            .WithMany(i => i.CustomIdElements)
            .HasForeignKey(el => el.InventoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}