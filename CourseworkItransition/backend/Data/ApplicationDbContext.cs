using System.Reflection;
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
    public DbSet<InventoryTag> InventoryTags => Set<InventoryTag>();
    public DbSet<InventoryAccess> InventoryAccess => Set<InventoryAccess>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<ItemLike> ItemLikes => Set<ItemLike>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }
}
