using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Hubs;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class ItemService : IItemService
{
    private readonly ApplicationDbContext _db;
    private readonly CustomIdGeneratorService _generator;
    private readonly IHubContext<InventoryHub> _hub;


    public ItemService(ApplicationDbContext db, CustomIdGeneratorService generator, IHubContext<InventoryHub> hub)
    {
        _db = db;
        _generator = generator;
        _hub = hub;
    }
    
    public async Task<Result<ItemsPageDto>> GetItems(Guid inventoryId, string? userId, bool isAdmin, int page, int pageSize, string sort)
    {
        var inv = await _db.Inventories.AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result<ItemsPageDto>.Failure(ResultStatus.NotFound,  "Item not found");
        }

        if (!inv.IsPublic && !isAdmin && inv.OwnerId != userId)
        {
            return Result<ItemsPageDto>.Failure(ResultStatus.Forbidden, "You do not have permission");
        }

        var canEdit = isAdmin || inv.OwnerId == userId;

        var fields = await _db.InventoryFields
            .AsNoTracking()
            .Where(f => f.InventoryId == inventoryId)
            .OrderBy(f => f.Order)
            .ToListAsync();

        var query = _db.Items
            .Include(i => i.Author)
            .Include(i => i.FieldValues).ThenInclude(v => v.Field)
            .Where(i => i.InventoryId == inventoryId)
            .AsNoTracking();

        query = sort switch
        {
            "oldest"   => query.OrderBy(i => i.CreatedAt),
            "customId" => query.OrderBy(i => i.CustomId),
            _          => query.OrderByDescending(i => i.CreatedAt),
        };

        pageSize = Math.Clamp(pageSize, 1, 100);
        page     = Math.Max(1, page);

        var total      = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        var items      = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

        var fieldDtos = fields.Select(f =>
            new InventoryFieldDto(f.Id, f.Title, f.Description, f.Type.ToString(), f.Order, f.ShowInTable)
        ).ToList();

        var itemDtos = items.Select(item => ToListDto(item)).ToList();

        var hasCustomIdFormat = await _db.CustomIdElements.AnyAsync(e => e.InventoryId == inventoryId);
        
        return Result<ItemsPageDto>.Success(
            new ItemsPageDto(fieldDtos, new PagedResult<ItemListItemDto>(itemDtos, total, page, pageSize, totalPages),
            canEdit,hasCustomIdFormat));
    }

    public async Task<Result<ItemDetailDto>> CreateItem(Guid inventoryId, string userId, bool isAdmin, CreateItemRequest req)
    {
        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result<ItemDetailDto>.Failure(ResultStatus.NotFound, "Item not found");
        }

        if (!inv.IsPublic && !isAdmin && inv.OwnerId != userId)
        {
            return Result<ItemDetailDto>.Failure(ResultStatus.Forbidden, "You do not have permission");
        }

        var customId = req.CustomId?.Trim() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(customId))
        {
            var hasFormat = await _db.CustomIdElements.AnyAsync(e => e.InventoryId == inventoryId);
            customId = hasFormat
                ? await _generator.GenerateAsync(inventoryId)
                : Guid.NewGuid().ToString("N").ToUpperInvariant();
        }

        if (!string.IsNullOrWhiteSpace(customId))
        {
            var exists = await _db.Items.AnyAsync(i => i.InventoryId == inventoryId && i.CustomId == customId);
            if (exists)
            {
                return Result<ItemDetailDto>.Failure(ResultStatus.Conflict,
                    "An item with this Custom ID already exists. Please modify it manually.");
            }
        }

        var item = new Item
        {
            CustomId    = customId,
            InventoryId = inventoryId,
            AuthorId    = userId,
        };

        _db.Items.Add(item);

        if (req.FieldValues?.Count > 0)
        {
            var fieldIds    = req.FieldValues.Select(v => v.FieldId).ToHashSet();
            var validFields = await _db.InventoryFields
                .Where(f => f.InventoryId == inventoryId && fieldIds.Contains(f.Id))
                .ToListAsync();

            foreach (var v in req.FieldValues)
            {
                if (validFields.Any(f => f.Id == v.FieldId))
                {
                    _db.ItemFieldValues.Add(new ItemFieldValue
                    {
                        ItemId  = item.Id,
                        FieldId = v.FieldId,
                        Value   = v.Value,
                    });
                }
            }
        }

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException?.Message.Contains("IX_Items_InventoryId_CustomId") == true)
        {
            return Result<ItemDetailDto>.Failure(ResultStatus.Conflict,
                "Custom ID conflict. Please try again or enter ID manually.");
        }

        await _db.Entry(item).Reference(i => i.Author).LoadAsync();
        await _db.Entry(item).Reference(i => i.Inventory).LoadAsync();
        await _db.Entry(item).Collection(i => i.FieldValues).Query()
            .Include(v => v.Field).LoadAsync();

        await UpdateSearchVectorAsync(item.Id, req.FieldValues?.Select(v => v.Value).ToList());
        
        return Result<ItemDetailDto>.Success(ToDetailDto(item, userId, isAdmin));
    }

    public async Task<Result<ItemDetailDto>> GetItem(Guid id, string? userId, bool isAdmin)
    {
        var item = await _db.Items
            .Include(i => i.Author)
            .Include(i => i.Inventory)
            .Include(i => i.FieldValues).ThenInclude(v => v.Field)
            .Include(i => i.Likes)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id);

        if (item is null)
        {
            return Result<ItemDetailDto>.Failure(ResultStatus.NotFound, "Item not found");
        }


        if (!item.Inventory.IsPublic && !isAdmin && item.Inventory.OwnerId != userId)
        {
            return Result<ItemDetailDto>.Failure(ResultStatus.Forbidden, "You do not have permission");
        }

        var likeCount   = item.Likes.Count;
        var isLikedByMe = userId != null && item.Likes.Any(l => l.UserId == userId);
        
        return Result<ItemDetailDto>.Success(ToDetailDto(item, userId, isAdmin, likeCount, isLikedByMe));
    }

    public async Task<Result> LikeItem(Guid id, string userId, bool isAdmin)
    {
        var item = await _db.Items.Include(i => i.Inventory).AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
        if (item is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Item not found");
        }

        if (!item.Inventory.IsPublic && !isAdmin && item.Inventory.OwnerId != userId)
        {
            return Result.Failure(ResultStatus.Forbidden, "You do not have permission");
        }

        var exists = await _db.ItemLikes.AnyAsync(l => l.ItemId == id && l.UserId == userId);
        if (exists)
        {
            return Result.Failure(ResultStatus.Conflict, "Item already liked");
        }

        _db.ItemLikes.Add(new ItemLike { ItemId = id, UserId = userId });
        await _db.SaveChangesAsync();

        var count = await _db.ItemLikes.CountAsync(l => l.ItemId == id);
        await _hub.Clients.Group($"inv-{item.InventoryId}").SendAsync("LikeUpdated", id, count);
        return Result.Success();
    }

    public async Task<Result> UnlikeItem(Guid id, string userId)
    {
        var item = await _db.Items.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
        if (item is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Item not found");
        }

        var like   = await _db.ItemLikes.FirstOrDefaultAsync(l => l.ItemId == id && l.UserId == userId);
        if (like is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Item not found");
        }

        _db.ItemLikes.Remove(like);
        await _db.SaveChangesAsync();

        var count = await _db.ItemLikes.CountAsync(l => l.ItemId == id);
        await _hub.Clients.Group($"inv-{item.InventoryId}").SendAsync("LikeUpdated", id, count);
        return Result.Success();
    }

    public async Task<Result<ItemDetailDto>> UpdateItem(Guid id, string userId, bool isAdmin, UpdateItemRequest req)
    {
        var item = await _db.Items
            .Include(i => i.Author)
            .Include(i => i.Inventory)
            .Include(i => i.FieldValues).ThenInclude(v => v.Field)
            .Include(i => i.Likes)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (item is null)
        {
            return Result<ItemDetailDto>.Failure(ResultStatus.NotFound, "Item not found");
        }
        
        if (!CanModifyItem(item, userId, isAdmin))
        {
            return Result<ItemDetailDto>.Failure(ResultStatus.Forbidden, "Item not modified");
        }

        if (item.Version != req.Version)
        {
            return Result<ItemDetailDto>.Failure(ResultStatus.Conflict,
                "Save conflict: the item was modified by someone else. Please reload.");
        }

        var newCustomId = req.CustomId?.Trim() ?? string.Empty;
        if (newCustomId != item.CustomId && !string.IsNullOrWhiteSpace(newCustomId))
        {
            var exists = await _db.Items.AnyAsync(i =>
                i.InventoryId == item.InventoryId && i.CustomId == newCustomId && i.Id != id);
            if (exists)
            {
                return Result<ItemDetailDto>.Failure(ResultStatus.Conflict, "An item with this Custom ID already exists in this inventory.");
            }
        }

        item.CustomId  = newCustomId;
        item.UpdatedAt = DateTime.UtcNow;
        item.Version  += 1;

        if (req.FieldValues is not null)
        {
            var updatedFieldIds = req.FieldValues.Select(v => v.FieldId).ToHashSet();
            var toRemove        = item.FieldValues.Where(v => updatedFieldIds.Contains(v.FieldId)).ToList();
            _db.ItemFieldValues.RemoveRange(toRemove);

            var validFields = await _db.InventoryFields
                .Where(f => f.InventoryId == item.InventoryId && updatedFieldIds.Contains(f.Id))
                .ToListAsync();

            foreach (var v in req.FieldValues)
            {
                if (validFields.Any(f => f.Id == v.FieldId))
                {
                    _db.ItemFieldValues.Add(new ItemFieldValue
                    {
                        ItemId  = item.Id,
                        FieldId = v.FieldId,
                        Value   = v.Value ?? string.Empty,
                    });
                }
            }
        }

        try { await _db.SaveChangesAsync(); }
        catch (DbUpdateConcurrencyException)
        {
            return Result<ItemDetailDto>.Failure(ResultStatus.Conflict, "Save conflict: the item was modified by someone else. Please reload."); 
        }

        await _db.Entry(item).Collection(i => i.FieldValues).Query()
            .Include(v => v.Field).LoadAsync();

        await UpdateSearchVectorAsync(item.Id, req.FieldValues?.Select(v => v.Value).ToList());

        var likeCount   = item.Likes.Count;
        var isLikedByMe = item.Likes.Any(l => l.UserId == userId);
        
        return Result<ItemDetailDto>.Success(ToDetailDto(item, userId, isAdmin, likeCount, isLikedByMe));
    }

    public async Task<Result> DeleteItem(Guid id, string userId, bool isAdmin)
    {
        var item = await _db.Items
            .Include(i => i.Inventory)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (item is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Item not found");
        }

        if (!CanModifyItem(item, userId, isAdmin))
        {
            return Result.Failure(ResultStatus.Forbidden, "Item not modified");
        }

        _db.Items.Remove(item);
        await _db.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result> DeleteItems(Guid inventoryId, List<Guid> ids, string userId, bool isAdmin)
    {
        if (ids.Count == 0)
        {
            return Result.Failure(ResultStatus.NotFound, "Items not found");
        }

        var inv = await _db.Inventories.FirstOrDefaultAsync(i => i.Id == inventoryId);
        if (inv is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Item not found");
        }

        if (!CanModifyInventory(inv, userId, isAdmin))
        {
            return Result.Failure(ResultStatus.Forbidden, "Item not modified");
        }

        var items = await _db.Items
            .Where(i => i.InventoryId == inventoryId && ids.Contains(i.Id))
            .ToListAsync();

        _db.Items.RemoveRange(items);
        await _db.SaveChangesAsync();
        return Result.Success();
    }
    

    private static ItemDetailDto ToDetailDto(
        Item item, string? userId, bool isAdmin, int likeCount = 0, bool isLikedByMe = false) =>
        new(
            item.Id,
            item.CustomId,
            item.AuthorId,
            item.Author.DisplayName,
            item.CreatedAt,
            item.UpdatedAt,
            item.Version,
            item.InventoryId,
            CanEdit: isAdmin || item.Inventory?.OwnerId == userId || item.AuthorId == userId,
            item.FieldValues
                .OrderBy(v => v.Field.Order)
                .Select(v => new ItemFieldValueDto(v.FieldId, v.Field.Title, v.Field.Type.ToString(), v.Value))
                .ToList(),
            likeCount,
            isLikedByMe
        );

    private static ItemListItemDto ToListDto(Item item) =>
        new(
            item.Id,
            item.CustomId,
            item.AuthorId,
            item.Author.DisplayName,
            item.CreatedAt,
            item.FieldValues
                .OrderBy(v => v.Field.Order)
                .Select(v => new ItemFieldValueDto(v.FieldId, v.Field.Title, v.Field.Type.ToString(), v.Value))
                .ToList()
        );
    
    private async Task UpdateSearchVectorAsync(Guid itemId, List<string>? values)
    {
        var text = string.Join(" ", (values ?? []).Where(v => !string.IsNullOrWhiteSpace(v)));
        if (string.IsNullOrWhiteSpace(text)) return;

        await _db.Database.ExecuteSqlInterpolatedAsync(
            $"UPDATE \"Items\" SET \"SearchVector\" = to_tsvector('english', {text}) WHERE \"Id\" = {itemId}");
    }
    
    private static bool CanModifyItem(Item item, string userId, bool isAdmin) =>
        isAdmin || item.Inventory.OwnerId == userId || item.AuthorId == userId;
    private static bool CanModifyInventory(Inventory inv, string userId, bool isAdmin) =>
        isAdmin || inv.OwnerId == userId;
}