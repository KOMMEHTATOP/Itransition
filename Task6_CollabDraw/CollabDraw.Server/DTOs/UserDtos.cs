namespace CollabDraw.Server.DTOs;

public record CreateUserRequest(string DisplayName);

public record UserResponse(Guid Id, Guid Token, string DisplayName);

public record UpdateUserRequest(string DisplayName);