using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface IInventoryFieldService
{
    Task<Result<List<InventoryFieldDto>>> GetFields(Guid inventoryId, string? userId, bool isAdmin);
    Task<Result<InventoryFieldDto>> CreateField(Guid inventoryId, string userId, bool isAdmin, CreateFieldRequest req);
    Task<Result<InventoryFieldDto>> UpdateField(Guid inventoryId, Guid fieldId, string userId, bool isAdmin, UpdateFieldRequest req);
    Task<Result> DeleteField(Guid inventoryId, Guid fieldId, string userId, bool isAdmin);
    Task<Result> ReorderFields(Guid inventoryId, string userId, bool isAdmin, List<Guid> orderedIds);
}