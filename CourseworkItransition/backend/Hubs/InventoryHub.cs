using Microsoft.AspNetCore.SignalR;

namespace InventoryApi.Hubs;

public class InventoryHub : Hub
{
    public async Task JoinInventory(string inventoryId)
        => await Groups.AddToGroupAsync(Context.ConnectionId, $"inv-{inventoryId}");

    public async Task LeaveInventory(string inventoryId)
        => await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"inv-{inventoryId}");
}
