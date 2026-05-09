using EduMatch.Data;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class PasswordResetTokenRepository : Repository<PasswordResetToken>, IPasswordResetTokenRepository
  {
    public PasswordResetTokenRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<PasswordResetToken?> GetValidTokenByHashAsync(string tokenHash)
    {
      return await _dbSet
        .Include(t => t.User)
        .FirstOrDefaultAsync(t =>
          t.TokenHash == tokenHash &&
          !t.IsUsed &&
          t.ExpiresAt > DateTime.UtcNow &&
          !t.IsDeleted);
    }

    public async Task<List<PasswordResetToken>> GetActiveTokensByUserIdAsync(long userId)
    {
      return await _dbSet
        .Where(t =>
          t.UserId == userId &&
          !t.IsUsed &&
          t.ExpiresAt > DateTime.UtcNow &&
          !t.IsDeleted)
        .ToListAsync();
    }
  }
}
