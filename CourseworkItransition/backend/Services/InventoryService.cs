using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto;
using InventoryApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class InventoryService :IInventoryService
{
    private readonly ApplicationDbContext _context;
    
    public InventoryService(ApplicationDbContext context)
    {
        _context = context;
    }
    
    public async Task<Result<PagedResult<InventoryListItemDto>>> GetAll(bool isAdmin, int page, int pageSize, string sort = "", string? tag = null)
    {
        var query = _context.Inventories
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .Where(i => isAdmin || i.IsPublic)
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(tag))
        {
            var t = tag.Trim().ToLowerInvariant();
            query = query.Where(i => i.Tags.Any(tt => tt.TagName == t));
        }

        query = sort switch
        {
            "oldest" => query.OrderBy(i => i.CreatedAt),
            "title"  => query.OrderBy(i => i.Title),
            _        => query.OrderByDescending(i => i.CreatedAt),
        };
        
        return Result<PagedResult<InventoryListItemDto>>.Success(await ToPagedResult(query, page, pageSize));
        
    }

    public async Task<Result<PagedResult<InventoryListItemDto>>> GetMy(string userId, int page, int pageSize, string sort = "")
    {
        var query = _context.Inventories
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .Where(i => i.OwnerId == userId)
            .AsNoTracking();

        query = sort switch
        {
            "oldest" => query.OrderBy(i => i.CreatedAt),
            "title"  => query.OrderBy(i => i.Title),
            _        => query.OrderByDescending(i => i.CreatedAt),
        };
        
        return Result<PagedResult<InventoryListItemDto>>.Success(await ToPagedResult(query, page, pageSize));
    }

    public async Task<Result<PagedResult<InventoryListItemDto>>> GetAccessible(string userId, bool isAdmin, int page, int pageSize, string sort)
    {
        var query = _context.Inventories
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .Where(i => i.OwnerId != userId &&
                        (isAdmin || i.IsPublic || i.AccessGrants.Any(a => a.UserId == userId)))
            .AsNoTracking();

        query = sort switch
        {
            "oldest" => query.OrderBy(i => i.CreatedAt),
            "title"  => query.OrderBy(i => i.Title),
            _        => query.OrderByDescending(i => i.CreatedAt),
        };
        
        return Result<PagedResult<InventoryListItemDto>>.Success(await ToPagedResult(query, page, pageSize));
    }

    public async Task<Result<InventoryDetailDto>> GetById(Guid id, string? userId, bool isAdmin)
    {
        var inv = await _context.Inventories
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .AsNoTracking()
            .FirstOrDefaultAsync(i => i.Id == id);

        if (inv is null)
        {
            return Result<InventoryDetailDto>.Failure(ResultStatus.NotFound, "Not found");
        }
        
        var hasAccess = inv.IsPublic
                        || isAdmin
                        || inv.OwnerId == userId
                        || await _context.InventoryAccess.AnyAsync(a => a.InventoryId == id && a.UserId == userId);

        if (!hasAccess)
        {
            return Result<InventoryDetailDto>.Failure(ResultStatus.Forbidden, "Access denied");
        }
        
        return Result<InventoryDetailDto>.Success(ToDetailDto(inv, userId, isAdmin));
    }

    public async Task<Result<List<TopInventoryDto>>> GetTop(int limit)
    {
        limit = Math.Clamp(limit, 1, 20);

        var top = await _context.Inventories
            .Where(i => i.IsPublic)
            .Include(i => i.Owner)
            .OrderByDescending(i => i.Items.Count())
            .Take(limit)
            .AsNoTracking()
            .Select(i => new TopInventoryDto(
                i.Id,
                i.Title,
                i.Owner.DisplayName,
                i.Items.Count()))
            .ToListAsync();
        
        return Result<List<TopInventoryDto>>.Success(top);
    }

    public async Task<Result<List<CategoryDto>>> GetCategories()
    {
        var cats = await _context.Categories
            .AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name))
            .ToListAsync();
        
        return Result<List<CategoryDto>>.Success(cats);
    }

    public async Task<Result<InventoryDetailDto>> Create(string userId, CreateInventoryRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Title))
        {
            return  Result<InventoryDetailDto>.Failure(ResultStatus.Invalid, "Title is required");
        }

        var inventory = new Inventory
        {
            Title       = req.Title.Trim(),
            Description = req.Description?.Trim() ?? string.Empty,
            IsPublic    = req.IsPublic,
            CategoryId  = req.CategoryId,
            OwnerId     = userId,
        };

        _context.Inventories.Add(inventory);
        await _context.SaveChangesAsync();
        await _context.Entry(inventory).Reference(i => i.Owner).LoadAsync();
        await _context.Entry(inventory).Reference(i => i.Category).LoadAsync();
        
        return Result<InventoryDetailDto>.Success(ToDetailDto(inventory, userId, true));
    }

    public async Task<Result<InventoryDetailDto>> Update(Guid id, string userId, bool isAdmin, UpdateInventoryRequest req)
    {
        var inventory = await _context.Inventories
            .Include(i => i.Owner)
            .Include(i => i.Category)
            .Include(i => i.Tags)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (inventory is null)
        {
            return Result<InventoryDetailDto>.Failure(ResultStatus.NotFound, "Not found");
        }

        if (!CanModify(inventory, userId, isAdmin))
        {
            return Result<InventoryDetailDto>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        if (inventory.Version != req.Version)
        {
            return Result<InventoryDetailDto>.Failure(ResultStatus.Conflict, "Save conflict: the inventory was modified by someone else. Please reload.");
        }

        inventory.Title       = req.Title.Trim();
        inventory.Description = req.Description?.Trim() ?? string.Empty;
        inventory.IsPublic    = req.IsPublic;
        inventory.CategoryId  = req.CategoryId;
        inventory.ImageUrl    = req.ImageUrl;
        inventory.UpdatedAt   = DateTime.UtcNow;
        inventory.Version    += 1;

        if (req.Tags is not null)
        {
            _context.InventoryTags.RemoveRange(inventory.Tags);
            var newTags = req.Tags
                .Select(t => t.Trim().ToLowerInvariant())
                .Where(t => t.Length > 0)
                .Distinct()
                .Select(t => new InventoryTag { InventoryId = id, TagName = t });
            _context.InventoryTags.AddRange(newTags);
        }

        try
        {
            await _context.SaveChangesAsync();
        }
        catch (DbUpdateConcurrencyException)
        {
            return Result<InventoryDetailDto>.Failure(ResultStatus.Conflict, "Save conflict: the inventory was modified by someone else. Please reload.");
        }

        await _context.Entry(inventory).Collection(i => i.Tags).LoadAsync();
        await _context.Entry(inventory).Reference(i => i.Category).LoadAsync();
        
        return Result<InventoryDetailDto>.Success(ToDetailDto(inventory, userId, isAdmin));
    }

    public async Task<Result> Delete(Guid id, string userId, bool isAdmin)
    {
        var inventory = await _context.Inventories.FindAsync(id);
        if (inventory is null)
        {
            return Result.Failure(ResultStatus.NotFound, "Not found");
        }

        if (!CanModify(inventory, userId, isAdmin))
        {
            return Result.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        _context.Inventories.Remove(inventory);
        await _context.SaveChangesAsync();
        
        return Result.Success();
    }

    public async Task<Result> DeleteBatch(List<Guid> ids, string userId, bool isAdmin)
    {
        if (ids.Count == 0)
        {
            return Result.Failure(ResultStatus.Invalid, "No ids provided");
        }
        
        var inventories = await _context.Inventories
            .Where(i => ids.Contains(i.Id))
            .ToListAsync();

        foreach (var inv in inventories)
        {
            if (!CanModify(inv, userId, isAdmin))
            {
                return Result.Failure(ResultStatus.Forbidden, "Forbidden");
            }
        }

        _context.Inventories.RemoveRange(inventories);
        await _context.SaveChangesAsync();
        return Result.Success();
    }

    public async Task<Result<InventoryStatsDto>> GetStats(Guid id, string? userId, bool isAdmin)
    {
        var inv = await _context.Inventories.AsNoTracking().FirstOrDefaultAsync(i => i.Id == id);
        if (inv is null)
        {
            return Result<InventoryStatsDto>.Failure(ResultStatus.NotFound, "Not found");
        }
        
        var hasAccess = inv.IsPublic
            || isAdmin
            || inv.OwnerId == userId
            || (userId != null && await _context.InventoryAccess.AnyAsync(a => a.InventoryId == id && a.UserId == userId));

        if (!hasAccess)
        {
            return Result<InventoryStatsDto>.Failure(ResultStatus.Forbidden, "Forbidden");
        }

        var totalItems = await _context.Items.CountAsync(i => i.InventoryId == id);

        var fields = await _context.InventoryFields
            .Where(f => f.InventoryId == id)
            .OrderBy(f => f.Order)
            .AsNoTracking()
            .ToListAsync();

        var numericStats = new List<NumericFieldStatDto>();
        var textStats    = new List<TextFieldStatDto>();

        foreach (var field in fields)
        {
            if (field.Type == FieldType.Number)
            {
                var rawValues = await _context.ItemFieldValues
                    .Where(fv => fv.FieldId == field.Id && fv.Value != string.Empty)
                    .Select(fv => fv.Value)
                    .ToListAsync();

                var parsed = rawValues
                    .Select(v => double.TryParse(v, System.Globalization.NumberStyles.Any,
                        System.Globalization.CultureInfo.InvariantCulture, out var d) ? d : (double?)null)
                    .Where(d => d.HasValue)
                    .Select(d => d!.Value)
                    .ToList();

                if (parsed.Count > 0)
                    numericStats.Add(new NumericFieldStatDto(
                        field.Id, field.Title, parsed.Count,
                        parsed.Min(), parsed.Max(),
                        Math.Round(parsed.Average(), 2)));
            }
            else if (field.Type is FieldType.Text or FieldType.MultilineText or FieldType.Link)
            {
                var topValues = await _context.ItemFieldValues
                    .Where(fv => fv.FieldId == field.Id && fv.Value != string.Empty)
                    .GroupBy(fv => fv.Value)
                    .OrderByDescending(g => g.Count())
                    .Take(5)
                    .Select(g => new TopValueDto(g.Key, g.Count()))
                    .ToListAsync();

                if (topValues.Count > 0)
                    textStats.Add(new TextFieldStatDto(field.Id, field.Title, topValues));
            }
        }
        
        return Result<InventoryStatsDto>.Success(new InventoryStatsDto(totalItems, numericStats, textStats));
    }
    
    private static async Task<PagedResult<InventoryListItemDto>> ToPagedResult(
        IQueryable<Inventory> query, int page, int pageSize)
    {
        pageSize = Math.Clamp(pageSize, 1, 100);
        page     = Math.Max(1, page);

        var total      = await query.CountAsync();
        var totalPages = (int)Math.Ceiling(total / (double)pageSize);
        var items      = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<InventoryListItemDto>(
            items.Select(ToListDto).ToList(),
            total, page, pageSize, totalPages
        );
    }
    
    private static InventoryListItemDto ToListDto(Inventory inv) =>
        new(
            inv.Id,
            inv.Title,
            inv.Description,
            inv.ImageUrl,
            inv.IsPublic,
            inv.OwnerId,
            inv.Owner.DisplayName,
            inv.CreatedAt,
            inv.UpdatedAt,
            inv.Version,
            inv.CategoryId,
            inv.Category?.Name,
            Tags: inv.Tags.Select(t => t.TagName).OrderBy(t => t).ToList()
        );
    
    private static InventoryDetailDto ToDetailDto(Inventory inv, string? userId, bool isAdmin) =>
        new(
            inv.Id,
            inv.Title,
            inv.Description,
            inv.ImageUrl,
            inv.IsPublic,
            inv.OwnerId,
            inv.Owner.DisplayName,
            inv.CreatedAt,
            inv.UpdatedAt,
            inv.Version,
            inv.CategoryId,
            inv.Category?.Name,
            CanEdit: isAdmin || inv.OwnerId == userId,
            Tags: inv.Tags.Select(t => t.TagName).OrderBy(t => t).ToList()
        );
    
    private static bool CanModify(Inventory inv, string userId, bool isAdmin) =>
        isAdmin || inv.OwnerId == userId;
}