namespace InventoryApi.Models.Dto;

public record InventoryListItemDto(
    Guid Id,
    string Title,
    string Description,
    string? ImageUrl,
    bool IsPublic,
    string OwnerId,
    string OwnerDisplayName,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int Version,
    int? CategoryId,
    string? CategoryName,
    List<string> Tags
);

public record InventoryDetailDto(
    Guid Id,
    string Title,
    string Description,
    string? ImageUrl,
    bool IsPublic,
    string OwnerId,
    string OwnerDisplayName,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int Version,
    int? CategoryId,
    string? CategoryName,
    bool CanEdit,
    List<string> Tags
);

public record CategoryDto(int Id, string Name);

public record CreateInventoryRequest(
    string Title,
    string? Description,
    bool IsPublic,
    int? CategoryId
);

public record UpdateInventoryRequest(
    string Title,
    string? Description,
    bool IsPublic,
    int? CategoryId,
    int Version,
    string? ImageUrl,
    List<string>? Tags
);

// --- Access ---

public record AccessUserDto(string Id, string DisplayName, string Email);

public record UserSearchResultDto(string Id, string DisplayName, string Email);

public record PagedResult<T>(
    List<T> Items,
    int Total,
    int Page,
    int PageSize,
    int TotalPages
);

// --- Fields ---

public record InventoryFieldDto(
    Guid Id,
    string Title,
    string Description,
    string Type,
    int Order,
    bool ShowInTable
);

public record CreateFieldRequest(
    string Title,
    string? Description,
    string Type,
    bool ShowInTable
);

public record UpdateFieldRequest(
    string Title,
    string? Description,
    bool ShowInTable,
    int Order
);

// --- Items ---

public record ItemFieldValueDto(
    Guid FieldId,
    string FieldTitle,
    string FieldType,
    string Value
);

public record ItemListItemDto(
    Guid Id,
    string CustomId,
    string AuthorId,
    string AuthorDisplayName,
    DateTime CreatedAt,
    List<ItemFieldValueDto> FieldValues
);

public record ItemDetailDto(
    Guid Id,
    string CustomId,
    string AuthorId,
    string AuthorDisplayName,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    int Version,
    Guid InventoryId,
    bool CanEdit,
    List<ItemFieldValueDto> FieldValues
);

public record ItemsPageDto(
    List<InventoryFieldDto> Fields,
    PagedResult<ItemListItemDto> Items,
    bool CanEdit,
    bool HasCustomIdFormat
);

// --- Custom ID ---

public record CustomIdElementDto(Guid Id, string Type, string FormatString, int Order);

public record CreateCustomIdElementRequest(string Type, string FormatString);

public record UpdateCustomIdElementRequest(string Type, string FormatString, int Order);

public record ItemFieldValueRequest(Guid FieldId, string Value);

public record CreateItemRequest(
    string CustomId,
    List<ItemFieldValueRequest>? FieldValues
);

public record UpdateItemRequest(
    string CustomId,
    List<ItemFieldValueRequest>? FieldValues,
    int Version
);
