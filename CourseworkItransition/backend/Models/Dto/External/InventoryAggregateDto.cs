namespace InventoryApi.Models.Dto.External;

public record InventoryAggregateDto(
    string Title,
    int ItemCount,
    List<FieldAggregateDto> Fields
);

public record FieldAggregateDto(
    string Title,
    string Type,
    NumericAggregateDto? Numeric,
    List<PopularValueDto>? PopularValues,
    BooleanAggregateDto? Boolean
);

public record NumericAggregateDto(
    double Average,
    double Min,
    double Max
);

public record PopularValueDto(
    string Value,
    int Count
);

public record BooleanAggregateDto(
    int TrueCount,
    int FalseCount
);
