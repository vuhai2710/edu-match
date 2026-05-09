using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface IPasswordResetTokenRepository : IRepository<PasswordResetToken>
  {
    Task<PasswordResetToken?> GetValidTokenByHashAsync(string tokenHash);
    Task<List<PasswordResetToken>> GetActiveTokensByUserIdAsync(long userId);
  }
}
