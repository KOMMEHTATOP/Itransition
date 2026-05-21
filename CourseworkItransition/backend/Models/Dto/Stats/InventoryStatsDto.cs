namespace InventoryApi.Models.Dto;

public record TopInventoryDto(
    Guid Id,
    string Title,
    string OwnerDisplayName,
    int ItemCount
);

public record TopValueDto(string Value, int Count);

public record NumericFieldStatDto(
    Guid FieldId,
    string FieldTitle,
    int Count,
    double Min,
    double Max,
    double Avg
);

public record TextFieldStatDto(
    Guid FieldId,
    string FieldTitle,
    List<TopValueDto> TopValues
);

public record InventoryStatsDto(
    int TotalItems,
    List<NumericFieldStatDto> NumericFields,
    List<TextFieldStatDto> TextFields
);
