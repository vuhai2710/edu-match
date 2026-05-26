using EduMatch.Common.Enums;
using EduMatch.Models;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Data
{
  public static class SeedData
  {
    private const string AdminFullName = "Admin";
    private const string AdminEmail = "admin@gmail.com";
    private const string AdminPassword = "123456";
    private const int DefaultDepositSessionCount = 1;
    private const decimal DefaultDepositDiscountPercent = 0m;

    public static async Task Initialize(IServiceProvider serviceProvider)
    {
      using var context = new AppDbContext(
        serviceProvider.GetRequiredService<DbContextOptions<AppDbContext>>());

      var adminUser = await context.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Admin);
      if (adminUser == null)
      {
        adminUser = new User();
        await context.Users.AddAsync(adminUser);
      }

      adminUser.FullName = AdminFullName;
      adminUser.Email = AdminEmail.Trim().ToLowerInvariant();
      adminUser.Password = BCrypt.Net.BCrypt.HashPassword(AdminPassword, workFactor: 12);
      adminUser.Role = UserRole.Admin;
      adminUser.IsActive = true;

      if (!await context.DepositPolicies.AnyAsync())
      {
        await context.DepositPolicies.AddAsync(new DepositPolicy
        {
          DepositSessionCount = DefaultDepositSessionCount,
          DiscountPercent = DefaultDepositDiscountPercent
        });
      }

      await context.SaveChangesAsync();
    }
  }
}
