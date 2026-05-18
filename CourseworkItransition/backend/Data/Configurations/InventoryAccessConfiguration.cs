using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApi.Data.Configurations;

public class InventoryAccessConfiguration  :IEntityTypeConfiguration<InventoryAccess>
{
    public void Configure(EntityTypeBuilder<InventoryAccess> builder)
    {
        builder.HasKey(a => new { a.InventoryId, a.UserId });
        builder.HasOne(a => a.Inventory)
            .WithMany(i => i.AccessGrants)
            .HasForeignKey(a => a.InventoryId)
            .OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(a => a.User)
            .WithMany()
            .HasForeignKey(a => a.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}