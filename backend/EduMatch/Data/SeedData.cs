using EduMatch.Common.Enums;
using EduMatch.Models;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Data
{
  public static class SeedData
  {
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
      using var context = new AppDbContext(
        serviceProvider.GetRequiredService<DbContextOptions<AppDbContext>>());

      if (await context.Users.AnyAsync(u => u.Role == UserRole.Admin))
      {
        return;
      }

      var adminUser = new User
      {
        FullName = "Admin",
        Email = "admin@edumatch.com",
        Password = BCrypt.Net.BCrypt.HashPassword("123456", workFactor: 12),
        Role = UserRole.Admin,
        IsActive = true
      };

      context.Users.Add(adminUser);
      await context.SaveChangesAsync();
    }
  }
}
