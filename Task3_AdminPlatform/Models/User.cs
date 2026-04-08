namespace Task3_AdminPlatform.Models;

public class User
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public required string Email { get; set; }
    public required string Password { get; set; }
    public DateTime RegistrationTime { get; set; }
    public DateTime? LastLoginTime { get; set; }
    public required string Status { get; set; }
}