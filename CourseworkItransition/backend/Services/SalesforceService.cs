using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using InventoryApi.Common;
using InventoryApi.Data;
using InventoryApi.Models.Dto.Salesforce;
using InventoryApi.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InventoryApi.Services;

public class SalesforceService : ISalesforceService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly ILogger<SalesforceService> _logger;
    private readonly ApplicationDbContext _db;

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
    };

    public SalesforceService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        ILogger<SalesforceService> logger,
        ApplicationDbContext db)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _logger = logger;
        _db = db;
    }

    public async Task<Result<SalesforcePushResultDto>> PushContactAsync(
        string userId,
        SalesforcePushRequest request)
    {
        var user = await _db.Users.AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null)
            return Result<SalesforcePushResultDto>.Failure(ResultStatus.NotFound, "User not found");

        var displayName = user.DisplayName;
        var email       = user.Email ?? string.Empty;

        try
        {
            var (accessToken, instanceUrl) = await GetAccessTokenAsync();

            var accountId = await CreateAccountAsync(accessToken, instanceUrl, request.Company);

            var contactId = await CreateContactAsync(
                accessToken, instanceUrl, accountId, displayName, email, request);

            var accountUrl = $"{instanceUrl}/lightning/r/Account/{accountId}/view";
            var contactUrl = $"{instanceUrl}/lightning/r/Contact/{contactId}/view";

            return Result<SalesforcePushResultDto>.Success(
                new SalesforcePushResultDto(accountId, contactId, accountUrl, contactUrl));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Salesforce push failed for {Email}", email);
            return Result<SalesforcePushResultDto>.Failure(
                ResultStatus.Error, "Failed to push data to Salesforce");
        }
    }
    
    private async Task<(string accessToken, string instanceUrl)> GetAccessTokenAsync()
    {
        var clientId     = _config["Salesforce:ClientId"]     ?? throw new InvalidOperationException("Salesforce:ClientId not configured");
        var clientSecret = _config["Salesforce:ClientSecret"] ?? throw new InvalidOperationException("Salesforce:ClientSecret not configured");
        var username     = _config["Salesforce:Username"]     ?? throw new InvalidOperationException("Salesforce:Username not configured");
        var password     = _config["Salesforce:Password"]     ?? throw new InvalidOperationException("Salesforce:Password not configured");
        var token        = _config["Salesforce:SecurityToken"] ?? string.Empty;

        var client = _httpClientFactory.CreateClient();

        var body = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"]    = "password",
            ["client_id"]     = clientId,
            ["client_secret"] = clientSecret,
            ["username"]      = username,
            ["password"]      = password + token,
        });

        var response = await client.PostAsync(
            "https://login.salesforce.com/services/oauth2/token", body);

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var doc  = JsonDocument.Parse(json);
        var root = doc.RootElement;

        return (
            root.GetProperty("access_token").GetString()!,
            root.GetProperty("instance_url").GetString()!
        );
    }
    
    private async Task<string> CreateAccountAsync(
        string accessToken, string instanceUrl, string company)
    {
        var client = BuildAuthorizedClient(accessToken);

        var payload = JsonSerializer.Serialize(new { Name = company }, JsonOptions);
        var content = new StringContent(payload, Encoding.UTF8, "application/json");

        var response = await client.PostAsync(
            $"{instanceUrl}/services/data/v59.0/sobjects/Account", content);

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var doc  = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("id").GetString()!;
    }
    
    private async Task<string> CreateContactAsync(
        string accessToken, string instanceUrl,
        string accountId, string displayName, string email,
        SalesforcePushRequest request)
    {
        var client = BuildAuthorizedClient(accessToken);

        // Split displayName into first/last (last word = LastName)
        var parts     = displayName.Trim().Split(' ', 2);
        var firstName = parts.Length > 1 ? parts[0] : null;
        var lastName  = parts.Length > 1 ? parts[1] : parts[0];

        var payload = JsonSerializer.Serialize(new
        {
            FirstName = firstName,
            LastName  = lastName,
            Email     = email,
            Phone     = request.Phone,
            Title     = request.JobTitle,
            AccountId = accountId,
        }, JsonOptions);

        var content  = new StringContent(payload, Encoding.UTF8, "application/json");
        var response = await client.PostAsync(
            $"{instanceUrl}/services/data/v59.0/sobjects/Contact", content);

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var doc  = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("id").GetString()!;
    }
    
    private HttpClient BuildAuthorizedClient(string accessToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);
        return client;
    }
}
