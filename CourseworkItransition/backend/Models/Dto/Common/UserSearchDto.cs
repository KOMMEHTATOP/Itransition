namespace InventoryApi.Models.Dto;

public record AccessUserDto(string Id, string DisplayName, string Email);

public record UserSearchResultDto(string Id, string DisplayName, string Email);

public record UserPublicProfileDto(string Id, string DisplayName, List<InventoryListItemDto> Inventories);
