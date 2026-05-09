using EduMatch.Configurations;
using EduMatch.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;

namespace EduMatch.Services
{
  public class EmailService : IEmailService
  {
    private readonly EmailSettings _emailSettings;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
    {
      _emailSettings = emailSettings.Value;
      _logger = logger;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetLink)
    {
      try
      {
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_emailSettings.FromName, _emailSettings.Username));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = "EduMatch - Đặt lại mật khẩu";

        var bodyBuilder = new BodyBuilder
        {
          HtmlBody = $@"
            <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;"">
              <h2 style=""color: #333;"">Đặt lại mật khẩu</h2>
              <p>Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản EduMatch.</p>
              <p>Click vào nút bên dưới để đặt lại mật khẩu:</p>
              <div style=""text-align: center; margin: 30px 0;"">
                <a href=""{resetLink}""
                   style=""background-color: #4CAF50; color: white; padding: 14px 28px;
                          text-decoration: none; border-radius: 6px; font-size: 16px;"">
                  Đặt lại mật khẩu
                </a>
              </div>
              <p style=""color: #666; font-size: 14px;"">Link này sẽ hết hạn sau 30 phút.</p>
              <p style=""color: #666; font-size: 14px;"">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
              <hr style=""border: none; border-top: 1px solid #eee; margin: 20px 0;"" />
              <p style=""color: #999; font-size: 12px;"">© EduMatch - Nền tảng kết nối gia sư</p>
            </div>"
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        await client.ConnectAsync(_emailSettings.Host, _emailSettings.Port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_emailSettings.Username, _emailSettings.Password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        _logger.LogInformation("Password reset email sent to {Email}", toEmail);
      }
      catch (System.Exception ex)
      {
        _logger.LogError(ex, "Failed to send password reset email to {Email}", toEmail);
      }
    }
  }
}
