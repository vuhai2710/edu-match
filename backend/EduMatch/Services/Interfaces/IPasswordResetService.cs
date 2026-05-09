namespace EduMatch.Services.Interfaces
{
  public interface IPasswordResetService
  {
    Task ForgotPasswordAsync(string email);
    Task ResetPasswordAsync(string token, string newPassword);
    Task<bool> ValidateTokenAsync(string token);
  }
}
