using EduMatch.DTOs;

namespace EduMatch.Services.Interfaces
{
  public interface IPasswordResetService
  {
    Task<ApiResponse> ForgotPasswordAsync(string email);
    Task<ApiResponse> ResetPasswordAsync(string token, string newPassword);
    Task<ApiResponse<bool>> ValidateTokenAsync(string token);
  }
}
