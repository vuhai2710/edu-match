using System.Security.Claims;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;

namespace EduMatch.Common.Extensions
{
  public static class ClaimsPrincipalExtensions
  {
    public static long GetRequiredUserId(this ClaimsPrincipal? principal)
    {
      return principal.GetRequiredLongClaim(
        ClaimTypes.NameIdentifier,
        "Không thể xác thực người dùng.");
    }

    public static long GetRequiredTutorId(this ClaimsPrincipal? principal)
    {
      return principal.GetRequiredLongClaim(
        "tutorId",
        "Không thể xác thực gia sư.");
    }

    public static long? TryGetLongClaim(this ClaimsPrincipal? principal, string claimType)
    {
      if (principal == null)
      {
        return null;
      }

      var claimValue = principal.FindFirstValue(claimType);
      return long.TryParse(claimValue, out var value) ? value : null;
    }

    public static UserRole GetRequiredUserRole(this ClaimsPrincipal? principal)
    {
      if (principal == null)
      {
        throw new UnauthorizedException("Cannot determine user role.");
      }

      var roleClaim = principal.FindFirstValue(ClaimTypes.Role);
      if (!Enum.TryParse<UserRole>(roleClaim, true, out var role))
      {
        throw new UnauthorizedException("Cannot determine user role.");
      }

      return role;
    }

    private static long GetRequiredLongClaim(
      this ClaimsPrincipal? principal,
      string claimType,
      string errorMessage)
    {
      if (principal == null)
      {
        throw new UnauthorizedException(errorMessage);
      }

      var claimValue = principal.FindFirstValue(claimType);
      if (!long.TryParse(claimValue, out var value))
      {
        throw new UnauthorizedException(errorMessage);
      }

      return value;
    }
  }
}
