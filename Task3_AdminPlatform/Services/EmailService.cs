using MailKit.Net.Smtp;
using Microsoft.Extensions.Options;
using MimeKit;
using Task3_AdminPlatform.Models;

namespace Task3_AdminPlatform.Services;

public class EmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendConfirmationEmailAsync(string userEmail, string confirmationLink)
    {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_settings.SenderName, _settings.SenderEmail));
        message.To.Add(new MailboxAddress("", userEmail));
        message.Subject = "Confirm your registration";

        message.Body = new TextPart("html")
        {
            Text = $"<h2>Welcome!</h2><p>Please confirm your account by <a href='{confirmationLink}'>clicking here</a>.</p>"
        };

        using var client = new SmtpClient();
        client.ServerCertificateValidationCallback = (s, c, h, e) => true;

        await client.ConnectAsync(_settings.SmtpServer, _settings.SmtpPort, MailKit.Security.SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_settings.Username, _settings.Password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);
    }
}