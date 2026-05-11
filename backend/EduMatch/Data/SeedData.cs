using EduMatch.Common.Enums;
using EduMatch.Models;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Data
{
  public static class SeedData
  {
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
      const string defaultAdminEmail = "admin@gmail.com";
      const string legacyAdminEmail = "admin@edumatch.com";
      const string defaultAdminPassword = "123456";

      using var context = new AppDbContext(
        serviceProvider.GetRequiredService<DbContextOptions<AppDbContext>>());

      var adminUser = await context.Users.FirstOrDefaultAsync(u =>
        u.Email == defaultAdminEmail || u.Email == legacyAdminEmail);

      if (adminUser == null)
      {
        adminUser = new User
        {
          FullName = "Admin",
          Email = defaultAdminEmail,
          Password = BCrypt.Net.BCrypt.HashPassword(defaultAdminPassword, workFactor: 12),
          Role = UserRole.Admin,
          IsActive = true
        };

        context.Users.Add(adminUser);
      }
      else
      {
        if (adminUser.Email == legacyAdminEmail)
        {
          adminUser.Password = BCrypt.Net.BCrypt.HashPassword(defaultAdminPassword, workFactor: 12);
        }

        adminUser.FullName = "Admin";
        adminUser.Email = defaultAdminEmail;
        adminUser.Role = UserRole.Admin;
        adminUser.IsActive = true;
      }

      await context.SaveChangesAsync();
    }
  }
}
