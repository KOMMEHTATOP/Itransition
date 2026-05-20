namespace InventoryApi.Services.Interfaces;

public interface ICustomIdGeneratorService
{
    Task<string> GenerateAsync(Guid inventoryId);
}