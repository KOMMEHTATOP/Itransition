using System.ComponentModel.DataAnnotations;

namespace InventoryApi.Models.Dto.Support;

public record SupportTicketRequest(
    [Required] string Summary,
    [Required] string Priority,
    [Required] string Link,
    string? Inventory
);
