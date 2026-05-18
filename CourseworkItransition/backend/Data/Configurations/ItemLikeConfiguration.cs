using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApi.Data.Configurations;

public class ItemLikeConfiguration :IEntityTypeConfiguration<ItemLike>
{
    public void Configure(EntityTypeBuilder<ItemLike> builder)
    {
        builder.HasKey(l => new { l.ItemId, l.UserId });

        builder.HasOne(l => l.Item)
            .WithMany(i => i.Likes)
            .HasForeignKey(l => l.ItemId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(l => l.User)
            .WithMany()
            .HasForeignKey(l => l.UserId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}