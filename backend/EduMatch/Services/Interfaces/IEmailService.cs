namespace EduMatch.Services.Interfaces
{
  public interface IEmailService
  {
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink);
  }
}
