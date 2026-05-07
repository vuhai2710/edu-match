using EduMatch.DTOs.Auth;
using EduMatch.DTOs.Tutor;
using EduMatch.DTOs.User;
using EduMatch.Enums;
using EduMatch.Exception;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Google.Apis.Auth;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace EduMatch.Services;

public class AuthService
{
  private readonly IConfiguration _config;
  private readonly IUserRepository _userRepository;
  private readonly ILogger<AuthService> _logger;

  public AuthService(IUserRepository userRepository, IConfiguration config, ILogger<AuthService> logger)
  {
    _userRepository = userRepository;
    _config = config;
    _logger = logger;
  }

  public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
  {
    var emailExists = await _userRepository.ExistsAsync(u => u.Email == dto.Email.ToLower().Trim());

    if (emailExists)
    {
      throw new AppException("Email đã được sử dụng");
    }

    var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12);

    var user = new User
    {
      FullName = dto.FullName,
      Email = dto.Email.ToLower().Trim(),
      Password = hashedPassword,
      Role = UserRole.Student
    };

    user.StudentProfile = new Student
    {
      Bio = string.Empty,
      School = string.Empty,
      GradeLevel = string.Empty
    };

    await _userRepository.AddAsync(user);
    await _userRepository.SaveChangesAsync();

    _logger.LogInformation("User registered: {Email} | Id: {Id}", user.Email, user.Id);

    return await BuildAuthResponseAsync(user);
  }

  public async Task<GoogleAuthResponseDto> GoogleLoginAsync(GoogleLoginRequestDto dto)
  {
    GoogleJsonWebSignature.Payload payload;
    try
    {
      payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, new GoogleJsonWebSignature.ValidationSettings
      {
        Audience = new[] { _config["GoogleAuth:ClientId"] ?? _config["GoogleAuth__ClientId"] }
      });
    }
    catch (InvalidJwtException ex)
    {
      _logger.LogError(ex, "Invalid Google token");
      throw new AppException("Invalid Google token", 401);
    }
    catch (System.Exception ex)
    {
      _logger.LogError(ex, "Error validating Google token");
      throw new AppException("Error during Google authentication", 401);
    }

    var user = await _userRepository.GetByEmailWithProfilesAsync(payload.Email);

    if (user == null)
    {
      user = new User
      {
        FullName = payload.Name,
        Email = payload.Email,
        Role = UserRole.Student,
        AvatarUrl = payload.Picture,
        IsGoogleAccount = true,
        Status = UserStatus.Active,
        IsActive = true
      };

      user.StudentProfile = new Student
      {
        Bio = string.Empty,
        School = string.Empty,
        GradeLevel = string.Empty
      };

      await _userRepository.AddAsync(user);
      await _userRepository.SaveChangesAsync();

      _logger.LogInformation("New user created via Google: {Email} | Id: {Id}", user.Email, user.Id);
    }
    else
    {
      _logger.LogInformation("Existing user logged in via Google: {Email} | Id: {Id}", user.Email, user.Id);
    }

    var token = GenerateJwtToken(user);

    return new GoogleAuthResponseDto
    {
      Token = token,
      User = new UserDto
      {
        Id = user.Id,
        Email = user.Email,
        FullName = user.FullName,
        Role = user.Role,
        AvatarUrl = user.AvatarUrl,
        Status = user.Status,
        IsActive = user.IsActive
      }
    };
  }

  public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
  {
    var user = await _userRepository.GetByEmailWithProfilesAsync(dto.Email);

    if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
    {
      throw new AppException("Email hoặc mật khẩu không đúng", 401);
    }

    _logger.LogInformation("User logged in: {Email} | Id: {Id}", user!.Email, user.Id);

    return await BuildAuthResponseAsync(user);
  }

  public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenDto dto)
  {
    var principal = GetPrincipalFromExpiredToken(dto.AccessToken);
    if (principal == null)
    {
      throw new AppException("Invalid access token or refresh token", 400);
    }

    var email = principal.FindFirst(ClaimTypes.Email)?.Value;
    if (string.IsNullOrEmpty(email))
    {
      throw new AppException("Invalid token payload", 400);
    }

    var user = await _userRepository.GetByEmailWithProfilesAsync(email);

    if (user == null || user.RefreshToken != dto.RefreshToken || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
    {
      throw new AppException("Invalid access token or refresh token", 400);
    }

    return await BuildAuthResponseAsync(user);
  }

  public async Task<AuthResponseDto> BecomeTutorAsync(long userId, BecomeTutorDto dto)
  {
    var user = await _userRepository.GetByIdWithProfilesAsync(userId);
    if (user == null)
    {
      throw new AppException("User not found", 404);
    }

    if (user.Role == UserRole.Tutor || user.TutorProfile != null)
    {
      throw new AppException("User is already a tutor", 400);
    }

    user.Role = UserRole.Tutor;
    user.TutorProfile = new Tutor
    {
      Bio = dto.Bio,
      HourlyRate = dto.HourlyRate,
      ApprovalStatus = ApprovalStatus.Pending
    };

    _userRepository.Update(user);
    await _userRepository.SaveChangesAsync();

    return await BuildAuthResponseAsync(user);
  }

  private async Task<AuthResponseDto> BuildAuthResponseAsync(User user)
  {
    var accessToken = GenerateJwtToken(user);
    var refreshToken = GenerateRefreshToken();

    user.RefreshToken = refreshToken;
    user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);

    _userRepository.Update(user);
    await _userRepository.SaveChangesAsync();

    return new AuthResponseDto
    {
      AccessToken = accessToken,
      RefreshToken = refreshToken,
      Role = user.Role.ToString(),
      UserId = user.Id,
      FullName = user.FullName
    };
  }

  private string GenerateJwtToken(User user)
  {
    var claims = new List<Claim>
    {
      new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
      new Claim(ClaimTypes.Email, user.Email),
      new Claim(ClaimTypes.Role, user.Role.ToString()),
      new Claim(ClaimTypes.Name, user.FullName)
    };

    if (user.StudentProfile != null)
    {
      claims.Add(new Claim("studentId", user.StudentProfile.Id.ToString()));
    }

    if (user.TutorProfile != null)
    {
      claims.Add(new Claim("tutorId", user.TutorProfile.Id.ToString()));
    }

    var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
    var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
    var expiry = int.Parse(_config["Jwt:ExpiryMinutes"] ?? "60");

    var token = new JwtSecurityToken(
      _config["Jwt:Issuer"],
      _config["Jwt:Audience"],
      claims,
      expires: DateTime.UtcNow.AddMinutes(expiry),
      signingCredentials: credentials
    );

    return new JwtSecurityTokenHandler().WriteToken(token);
  }

  private static string GenerateRefreshToken()
  {
    var randomNumber = new byte[64];
    using var rng = RandomNumberGenerator.Create();
    rng.GetBytes(randomNumber);
    return Convert.ToBase64String(randomNumber);
  }

  private ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
  {
    var tokenValidationParameters = new TokenValidationParameters
    {
      ValidateAudience = true,
      ValidateIssuer = true,
      ValidIssuer = _config["Jwt:Issuer"],
      ValidAudience = _config["Jwt:Audience"],
      ValidateIssuerSigningKey = true,
      IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!)),
      ValidateLifetime = false
    };

    var tokenHandler = new JwtSecurityTokenHandler();
    var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);

    if (securityToken is not JwtSecurityToken jwtSecurityToken || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
    {
      throw new SecurityTokenException("Invalid token");
    }

    return principal;
  }
}