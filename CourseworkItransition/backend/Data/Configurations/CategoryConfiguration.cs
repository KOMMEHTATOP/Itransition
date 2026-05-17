using InventoryApi.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InventoryApi.Data.Configurations;

public class CategoryConfiguration: IEntityTypeConfiguration<Category>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.HasData(
            new Category { Id = 1, Name = "Equipment" },
            new Category { Id = 2, Name = "Furniture" },
            new Category { Id = 3, Name = "Book" },
            new Category { Id = 4, Name = "Other" }
        );
    }
}