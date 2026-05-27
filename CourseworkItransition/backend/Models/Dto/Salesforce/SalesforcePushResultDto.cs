namespace InventoryApi.Models.Dto.Salesforce;

public record SalesforcePushResultDto(
    string AccountId,
    string ContactId,
    string AccountUrl,
    string ContactUrl
);
