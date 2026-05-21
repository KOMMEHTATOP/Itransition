using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface ITagService
{
    Task<Result<List<string>>> Search(string q, int limit);
    Task<Result<List<TagCloudItemDto>>> Cloud(int limit);
}