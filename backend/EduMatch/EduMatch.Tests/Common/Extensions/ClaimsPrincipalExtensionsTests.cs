using System.Security.Claims;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;

namespace EduMatch.Tests.Common.Extensions;

public class ClaimsPrincipalExtensionsTests
{
  [Fact]
  public void GetRequiredUserId_ReturnsParsedId()
  {
    var principal = CreatePrincipal((ClaimTypes.NameIdentifier, "42"));

    var userId = principal.GetRequiredUserId();

    Assert.Equal(42L, userId);
  }

  [Fact]
  public void GetRequiredUserId_ThrowsUnauthorized_WhenClaimMissing()
  {
    var principal = CreatePrincipal();

    Assert.Throws<UnauthorizedException>(() => principal.GetRequiredUserId());
  }

  [Fact]
  public void GetRequiredTutorId_ReturnsParsedId()
  {
    var principal = CreatePrincipal(("tutorId", "7"));

    var tutorId = principal.GetRequiredTutorId();

    Assert.Equal(7L, tutorId);
  }

  [Fact]
  public void GetRequiredUserRole_ReturnsParsedRole()
  {
    var principal = CreatePrincipal((ClaimTypes.Role, UserRole.Admin.ToString()));

    var role = principal.GetRequiredUserRole();

    Assert.Equal(UserRole.Admin, role);
  }

  [Fact]
  public void TryGetLongClaim_ReturnsNull_WhenClaimInvalid()
  {
    var principal = CreatePrincipal(("tutorId", "invalid"));

    var value = principal.TryGetLongClaim("tutorId");

    Assert.Null(value);
  }

  private static ClaimsPrincipal CreatePrincipal(params (string Type, string Value)[] claims)
  {
    return new ClaimsPrincipal(
      new ClaimsIdentity(
        claims.Select(claim => new Claim(claim.Type, claim.Value)),
        "TestAuthType"));
  }
}
