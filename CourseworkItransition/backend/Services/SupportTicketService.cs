using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models;
using InventoryApi.Models.Dto.Support;
using InventoryApi.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class SupportTicketService : ISupportTicketService
{
    private const string TokenEndpoint = "https://login.microsoftonline.com/consumers/oauth2/v2.0/token";
    private const string GraphScope    = "offline_access Files.ReadWrite User.Read";
    private const string RefreshTokenKey = "OneDrive:RefreshToken";

    private static readonly string[] AllowedPriorities = ["High", "Average", "Low"];

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        WriteIndented = true,
    };

    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<SupportTicketService> _logger;
    private readonly ApplicationDbContext _db;
    private readonly UserManager<ApplicationUser> _userManager;

    public SupportTicketService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<SupportTicketService> logger,
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
        _db = db;
        _userManager = userManager;
    }

    public async Task<Result<SupportTicketResultDto>> CreateTicketAsync(
        string userId,
        SupportTicketRequest request)
    {
        if (!AllowedPriorities.Contains(request.Priority))
            return Result<SupportTicketResultDto>.Failure(
                ResultStatus.Invalid, "Priority must be High, Average or Low");

        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            return Result<SupportTicketResultDto>.Failure(ResultStatus.NotFound, "User not found");

        try
        {
            var adminEmails = (await _userManager.GetUsersInRoleAsync("Admin"))
                .Where(u => !string.IsNullOrEmpty(u.Email))
                .Select(u => u.Email!)
                .ToList();

            var ticketId = $"TKT-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpperInvariant()}";

            var payload = new
            {
                ticketId,
                reportedBy = user.Email ?? user.DisplayName,
                inventory  = request.Inventory,
                link       = request.Link,
                priority   = request.Priority,
                summary    = request.Summary,
                adminEmails,
            };

            var json = JsonSerializer.Serialize(payload, JsonOptions);

            var accessToken = await GetAccessTokenAsync();
            await UploadJsonAsync(accessToken, $"{ticketId}.json", json);

            return Result<SupportTicketResultDto>.Success(new SupportTicketResultDto(ticketId));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Support ticket upload failed for user {UserId}", userId);
            return Result<SupportTicketResultDto>.Failure(
                ResultStatus.Error, "Failed to create support ticket");
        }
    }

    private async Task<string> GetAccessTokenAsync()
    {
        var clientId     = _config["OneDrive:ClientId"]     ?? throw new InvalidOperationException("OneDrive:ClientId not configured");
        var clientSecret = _config["OneDrive:ClientSecret"] ?? throw new InvalidOperationException("OneDrive:ClientSecret not configured");
        var refreshToken = await GetRefreshTokenAsync();

        var client = _httpClientFactory.CreateClient();

        var body = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"]    = "refresh_token",
            ["client_id"]     = clientId,
            ["client_secret"] = clientSecret,
            ["refresh_token"] = refreshToken,
            ["scope"]         = GraphScope,
        });

        var response = await client.PostAsync(TokenEndpoint, body);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        var root = JsonDocument.Parse(responseJson).RootElement;

        var accessToken = root.GetProperty("access_token").GetString()!;

        if (root.TryGetProperty("refresh_token", out var rotated))
            await SaveRefreshTokenAsync(rotated.GetString()!);

        return accessToken;
    }

    private async Task UploadJsonAsync(string accessToken, string fileName, string json)
    {
        var folderPath = (_config["OneDrive:FolderPath"] ?? "/SupportTickets").Trim('/');

        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);

        var content = new StringContent(json, Encoding.UTF8, "application/json");

        var url = $"https://graph.microsoft.com/v1.0/me/drive/root:/{folderPath}/{fileName}:/content";
        var response = await client.PutAsync(url, content);

        response.EnsureSuccessStatusCode();
    }

    private async Task<string> GetRefreshTokenAsync()
    {
        var stored = await _db.AppSettings.AsNoTracking()
            .FirstOrDefaultAsync(s => s.Key == RefreshTokenKey);

        if (stored is not null && !string.IsNullOrEmpty(stored.Value))
            return stored.Value;

        return _config["OneDrive:RefreshToken"]
               ?? throw new InvalidOperationException("OneDrive:RefreshToken not configured");
    }

    private async Task SaveRefreshTokenAsync(string refreshToken)
    {
        var existing = await _db.AppSettings
            .FirstOrDefaultAsync(s => s.Key == RefreshTokenKey);

        if (existing is null)
            _db.AppSettings.Add(new AppSetting { Key = RefreshTokenKey, Value = refreshToken });
        else
            existing.Value = refreshToken;

        await _db.SaveChangesAsync();
    }
}
