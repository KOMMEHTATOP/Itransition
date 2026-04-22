using CollabDraw.Server.Data;
using CollabDraw.Server.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace CollabDraw.Server.Hubs;

public class WhiteboardHub : Hub
{
    private readonly AppDbContext _db;

    // Хранение online-пользователей: connectionId → { userId, displayName, boardId }
    private static readonly Dictionary<string, ConnectedUser> ConnectedUsers = new();

    public WhiteboardHub(AppDbContext db)
    {
        _db = db;
    }

    // --- Подключение к доске ---

    public async Task JoinBoard(Guid boardId)
    {
        var user = await GetCurrentUser();
        if (user == null) return;

        var groupName = $"board_{boardId}";
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        // Добавить в BoardUsers если ещё не участник
        var existing = await _db.BoardUsers
            .FirstOrDefaultAsync(bu => bu.BoardId == boardId && bu.UserId == user.Id);

        if (existing == null)
        {
            _db.BoardUsers.Add(new BoardUser
            {
                Id = Guid.NewGuid(),
                BoardId = boardId,
                UserId = user.Id,
                Role = BoardRole.Editor
            });
            await _db.SaveChangesAsync();
        }

        ConnectedUsers[Context.ConnectionId] = new ConnectedUser(user.Id, user.DisplayName, boardId);

        await Clients.OthersInGroup(groupName).SendAsync("UserJoined", user.Id, user.DisplayName);
    }

    public async Task LeaveBoard(Guid boardId)
    {
        var groupName = $"board_{boardId}";
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

        if (ConnectedUsers.TryGetValue(Context.ConnectionId, out var cu))
        {
            await Clients.OthersInGroup(groupName).SendAsync("UserLeft", cu.UserId);
            ConnectedUsers.Remove(Context.ConnectionId);
        }
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        if (ConnectedUsers.TryGetValue(Context.ConnectionId, out var cu))
        {
            var groupName = $"board_{cu.BoardId}";
            await Clients.OthersInGroup(groupName).SendAsync("UserLeft", cu.UserId);
            ConnectedUsers.Remove(Context.ConnectionId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    // --- Элементы ---

    public async Task SendElementAdded(Guid boardId, Guid pageId, Guid elementId, string type, string properties, int zIndex)
    {
        var user = await GetCurrentUser();
        if (user == null) return;

        if (!await HasMinRole(boardId, user.Id, BoardRole.Editor)) return;

        var element = new Element
        {
            Id = elementId,
            PageId = pageId,
            Type = type,
            Properties = properties,
            ZIndex = zIndex,
            CreatedById = user.Id
        };

        _db.Elements.Add(element);
        await _db.SaveChangesAsync();

        await Clients.OthersInGroup($"board_{boardId}")
            .SendAsync("ElementAdded", pageId, elementId, type, properties, zIndex, user.Id);
    }

    public async Task SendElementModified(Guid boardId, Guid pageId, Guid elementId, string properties, int version)
    {
        var user = await GetCurrentUser();
        if (user == null) return;

        if (!await HasMinRole(boardId, user.Id, BoardRole.Editor)) return;

        var element = await _db.Elements.FirstOrDefaultAsync(e => e.Id == elementId);
        if (element == null) return;

        element.Properties = properties;
        element.Version = version;
        element.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await Clients.OthersInGroup($"board_{boardId}")
            .SendAsync("ElementModified", pageId, elementId, properties, version);
    }

    public async Task SendElementDeleted(Guid boardId, Guid pageId, Guid elementId)
    {
        var user = await GetCurrentUser();
        if (user == null) return;

        if (!await HasMinRole(boardId, user.Id, BoardRole.Editor)) return;

        var element = await _db.Elements.FirstOrDefaultAsync(e => e.Id == elementId);
        if (element == null) return;

        element.IsDeleted = true;
        element.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        await Clients.OthersInGroup($"board_{boardId}")
            .SendAsync("ElementDeleted", pageId, elementId);
    }

    // --- Курсоры ---

    public async Task SendCursorMoved(Guid boardId, double x, double y)
    {
        if (ConnectedUsers.TryGetValue(Context.ConnectionId, out var cu))
        {
            await Clients.OthersInGroup($"board_{cu.BoardId}")
                .SendAsync("CursorMoved", cu.UserId, cu.DisplayName, x, y);
        }
    }

    // --- Страницы ---

    public async Task SendPageAdded(Guid boardId, Guid pageId, string title, int sortOrder)
    {
        var user = await GetCurrentUser();
        if (user == null) return;

        if (!await HasMinRole(boardId, user.Id, BoardRole.Editor)) return;

        await Clients.OthersInGroup($"board_{boardId}")
            .SendAsync("PageAdded", pageId, title, sortOrder);
    }

    public async Task SendPageDeleted(Guid boardId, Guid pageId)
    {
        var user = await GetCurrentUser();
        if (user == null) return;

        if (!await HasMinRole(boardId, user.Id, BoardRole.Editor)) return;

        await Clients.OthersInGroup($"board_{boardId}")
            .SendAsync("PageDeleted", pageId);
    }

    // --- Роли ---

    public async Task SendRoleChanged(Guid boardId, Guid targetUserId, string newRole)
    {
        var user = await GetCurrentUser();
        if (user == null) return;

        if (!await HasMinRole(boardId, user.Id, BoardRole.Admin)) return;

        if (!Enum.TryParse<BoardRole>(newRole, out var role)) return;

        var bu = await _db.BoardUsers
            .FirstOrDefaultAsync(x => x.BoardId == boardId && x.UserId == targetUserId);
        if (bu == null) return;

        // Нельзя менять роль Owner
        if (bu.Role == BoardRole.Owner) return;

        bu.Role = role;
        await _db.SaveChangesAsync();

        await Clients.Group($"board_{boardId}")
            .SendAsync("RoleChanged", targetUserId, newRole);
    }

    // --- Helpers ---

    private async Task<User?> GetCurrentUser()
    {
        var httpContext = Context.GetHttpContext();
        if (httpContext == null) return null;

        var tokenStr = httpContext.Request.Query["token"].FirstOrDefault();
        if (Guid.TryParse(tokenStr, out var token))
            return await _db.Users.FirstOrDefaultAsync(u => u.Token == token);

        return null;
    }

    private async Task<bool> HasMinRole(Guid boardId, Guid userId, BoardRole minimumRole)
    {
        var bu = await _db.BoardUsers.FirstOrDefaultAsync(x => x.BoardId == boardId && x.UserId == userId);
        return bu != null && bu.Role >= minimumRole;
    }

    private record ConnectedUser(Guid UserId, string DisplayName, Guid BoardId);
}