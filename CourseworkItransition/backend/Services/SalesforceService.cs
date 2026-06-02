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
    private const string ApiVersion = "v59.0";

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

            // Upsert by email: update the existing Contact if one already exists, otherwise create.
            var existing = await FindContactByEmailAsync(accessToken, instanceUrl, email);

            string accountId;
            string contactId;
            bool   updated;

            if (existing is not null)
            {
                contactId = existing.Value.ContactId;
                accountId = await UpdateContactAndAccountAsync(
                    accessToken, instanceUrl, contactId, existing.Value.AccountId, displayName, request);
                updated = true;
            }
            else
            {
                accountId = await CreateAccountAsync(accessToken, instanceUrl, request.Company);
                contactId = await CreateContactAsync(
                    accessToken, instanceUrl, accountId, displayName, email, request);
                updated = false;
            }

            var accountUrl = $"{instanceUrl}/lightning/r/Account/{accountId}/view";
            var contactUrl = $"{instanceUrl}/lightning/r/Contact/{contactId}/view";

            return Result<SalesforcePushResultDto>.Success(
                new SalesforcePushResultDto(accountId, contactId, accountUrl, contactUrl, updated));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Salesforce push failed for {Email}", email);
            return Result<SalesforcePushResultDto>.Failure(
                ResultStatus.Error, "Failed to push data to Salesforce");
        }
    }

    private async Task<(string ContactId, string? AccountId)?> FindContactByEmailAsync(
        string accessToken, string instanceUrl, string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return null;

        var soql = $"SELECT Id, AccountId FROM Contact WHERE Email = '{email.Replace("'", "\\'")}' LIMIT 1";
        var client = BuildAuthorizedClient(accessToken);

        var response = await client.GetAsync(
            $"{instanceUrl}/services/data/{ApiVersion}/query?q={Uri.EscapeDataString(soql)}");

        response.EnsureSuccessStatusCode();

        var json    = await response.Content.ReadAsStringAsync();
        var root    = JsonDocument.Parse(json).RootElement;
        var records = root.GetProperty("records");

        if (records.GetArrayLength() == 0)
            return null;

        var record    = records[0];
        var contactId = record.GetProperty("Id").GetString()!;
        var accountId = record.TryGetProperty("AccountId", out var acc) && acc.ValueKind != JsonValueKind.Null
            ? acc.GetString()
            : null;

        return (contactId, accountId);
    }

    private async Task<string> UpdateContactAndAccountAsync(
        string accessToken, string instanceUrl,
        string contactId, string? accountId, string displayName, SalesforcePushRequest request)
    {
        var (firstName, lastName) = SplitName(displayName);

        await PatchAsync(accessToken, instanceUrl, "Contact", contactId, new
        {
            FirstName = firstName,
            LastName  = lastName,
            Phone     = request.Phone,
            Title     = request.JobTitle,
        });

        if (accountId is not null)
        {
            await PatchAsync(accessToken, instanceUrl, "Account", accountId, new { Name = request.Company });
            return accountId;
        }

        // Existing contact had no linked account — create one and link it.
        var newAccountId = await CreateAccountAsync(accessToken, instanceUrl, request.Company);
        await PatchAsync(accessToken, instanceUrl, "Contact", contactId, new { AccountId = newAccountId });
        return newAccountId;
    }

    private async Task PatchAsync(
        string accessToken, string instanceUrl, string sObject, string id, object body)
    {
        var client  = BuildAuthorizedClient(accessToken);
        var payload = JsonSerializer.Serialize(body, JsonOptions);
        var content = new StringContent(payload, Encoding.UTF8, "application/json");

        var response = await client.PatchAsync(
            $"{instanceUrl}/services/data/{ApiVersion}/sobjects/{sObject}/{id}", content);

        response.EnsureSuccessStatusCode();
    }

    private async Task<(string accessToken, string instanceUrl)> GetAccessTokenAsync()
    {
        var clientId     = _config["Salesforce:ClientId"]     ?? throw new InvalidOperationException("Salesforce:ClientId not configured");
        var clientSecret = _config["Salesforce:ClientSecret"] ?? throw new InvalidOperationException("Salesforce:ClientSecret not configured");
        var loginUrl     = _config["Salesforce:LoginUrl"]     ?? throw new InvalidOperationException("Salesforce:LoginUrl not configured");

        var client = _httpClientFactory.CreateClient();

        var body = new FormUrlEncodedContent(new Dictionary<string, string>
        {
            ["grant_type"]    = "client_credentials",
            ["client_id"]     = clientId,
            ["client_secret"] = clientSecret,
        });

        var response = await client.PostAsync($"{loginUrl}/services/oauth2/token", body);

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
            $"{instanceUrl}/services/data/{ApiVersion}/sobjects/Account", content);

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

        var (firstName, lastName) = SplitName(displayName);

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
            $"{instanceUrl}/services/data/{ApiVersion}/sobjects/Contact", content);

        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadAsStringAsync();
        var doc  = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("id").GetString()!;
    }

    private static (string? firstName, string lastName) SplitName(string displayName)
    {
        var parts     = displayName.Trim().Split(' ', 2);
        var firstName = parts.Length > 1 ? parts[0] : null;
        var lastName  = parts.Length > 1 ? parts[1] : parts[0];
        return (firstName, lastName);
    }

    private HttpClient BuildAuthorizedClient(string accessToken)
    {
        var client = _httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", accessToken);
        // Bypass Salesforce "Alert" duplicate rules (allowSave=true) so the create path
        // does not fail with DUPLICATES_DETECTED (400) on fuzzy name matches.
        client.DefaultRequestHeaders.Add("Sforce-Duplicate-Rule-Header", "allowSave=true");
        return client;
    }
}
