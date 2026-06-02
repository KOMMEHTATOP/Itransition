namespace InventoryApi.Models.Dto.External;

public record ExternalCreateItemsRequest(
    List<ExternalItemInput> Items
);

public record ExternalItemInput(
    string? CustomId,
    Dictionary<string, string>? Fields
);

public record ExternalCreateItemsResultDto(
    int Created,
    List<ExternalItemResultDto> Results
);

public record ExternalItemResultDto(
    bool Success,
    string? CustomId,
    string? Error
);
