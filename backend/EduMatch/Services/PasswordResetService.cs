using EduMatch.Common.Exception;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using System.Security.Cryptography;
using System.Text;

namespace EduMatch.Services
{
  public class PasswordResetService : IPasswordResetService
  {
    private readonly IUserRepository _userRepository;
    private readonly IPasswordResetTokenRepository _tokenRepository;
    private readonly IEmailService _emailService;
    private readonly IConfiguration _config;
    private readonly ILogger<PasswordResetService> _logger;

    private const int TokenExpiryMinutes = 30;

    public PasswordResetService(
      IUserRepository userRepository,
      IPasswordResetTokenRepository tokenRepository,
      IEmailService emailService,
      IConfiguration config,
      ILogger<PasswordResetService> logger)
    {
      _userRepository = userRepository;
      _tokenRepository = tokenRepository;
      _emailService = emailService;
      _config = config;
      _logger = logger;
    }

    public async Task ForgotPasswordAsync(string email)
    {
      var user = await _userRepository.GetByEmailAsync(email);

      if (user == null)
      {
        _logger.LogInformation("Forgot password requested for non-existing email: {Email}", email);
        throw new AppException("Email chưa được đăng ký");
      }

      if (user.IsGoogleAccount)
      {
        _logger.LogInformation("Forgot password requested for Google account: {Email}", email);
        return;
      }

      var rawToken = GenerateSecureToken();
      var tokenHash = HashToken(rawToken);

      var resetToken = new PasswordResetToken
      {
        UserId = user.Id,
        TokenHash = tokenHash,
        ExpiresAt = DateTime.UtcNow.AddMinutes(TokenExpiryMinutes)
      };

      await _tokenRepository.AddAsync(resetToken);
      await _tokenRepository.SaveChangesAsync();

      var baseUrl = _config["Frontend:BaseUrl"] ?? "http://localhost:4200";
      var resetPath = _config["Frontend:ResetPasswordPath"] ?? "/auth/reset-password";
      var resetLink = $"{baseUrl}{resetPath}?token={rawToken}";

      await _emailService.SendPasswordResetEmailAsync(user.Email, resetLink);

      _logger.LogInformation("Password reset token created for user {UserId}", user.Id);
    }

    public async Task ResetPasswordAsync(string token, string newPassword)
    {
      var tokenHash = HashToken(token);
      var resetToken = await _tokenRepository.GetValidTokenByHashAsync(tokenHash);

      if (resetToken == null)
      {
        throw new AppException("Token không hợp lệ hoặc đã hết hạn");
      }

      var user = resetToken.User;

      user.Password = BCrypt.Net.BCrypt.HashPassword(newPassword, workFactor: 12);

      resetToken.IsUsed = true;
      resetToken.UsedAt = DateTime.UtcNow;

      var activeTokens = await _tokenRepository.GetActiveTokensByUserIdAsync(user.Id);
      foreach (var activeToken in activeTokens)
      {
        if (activeToken.Id != resetToken.Id)
        {
          activeToken.IsUsed = true;
          activeToken.UsedAt = DateTime.UtcNow;
        }
      }

      _userRepository.Update(user);
      await _tokenRepository.SaveChangesAsync();

      _logger.LogInformation("Password reset successfully for user {UserId}", user.Id);
    }

    public async Task<bool> ValidateTokenAsync(string token)
    {
      var tokenHash = HashToken(token);
      var resetToken = await _tokenRepository.GetValidTokenByHashAsync(tokenHash);
      return resetToken != null;
    }

    private static string GenerateSecureToken()
    {
      var bytes = new byte[32];
      using var rng = RandomNumberGenerator.Create();
      rng.GetBytes(bytes);
      return Convert.ToBase64String(bytes)
        .Replace("+", "-")
        .Replace("/", "_")
        .TrimEnd('=');
    }

    private static string HashToken(string token)
    {
      var bytes = Encoding.UTF8.GetBytes(token);
      var hash = SHA256.HashData(bytes);
      return Convert.ToHexString(hash).ToLowerInvariant();
    }
  }
}
