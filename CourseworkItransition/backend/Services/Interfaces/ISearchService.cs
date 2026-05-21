using InventoryApi.Common;
using InventoryApi.Models.Dto;

namespace InventoryApi.Services.Interfaces;

public interface ISearchService
{
    Task<Result<SearchResultDto>> Search(string q);
}