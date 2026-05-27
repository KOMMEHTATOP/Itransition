using System.ComponentModel.DataAnnotations;

namespace InventoryApi.Models.Dto.Salesforce;

public record SalesforcePushRequest(
    [Required] string Phone,
    [Required] string Company,
    [Required] string JobTitle
);
