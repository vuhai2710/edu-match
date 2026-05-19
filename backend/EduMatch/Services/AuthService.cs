using AutoMapper;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.DTOs.Auth;
using EduMatch.DTOs.User;
using EduMatch.Models;
using EduMatch.Repositories;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Google.Apis.Auth;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FileEntity = EduMatch.Models.File;

namespace EduMatch.Services;

public class AuthService
{
  private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);
  private readonly IConfiguration _config;
  private readonly IFileService _fileService;
  private readonly IUserRepository _userRepository;
  private readonly IRepository<Subject> _subjectRepository;
  private readonly IRepository<TutorSubject> _tutorSubjectRepository;
  private readonly IRepository<TutorTeachingLevel> _tutorTeachingLevelRepository;
  private readonly ILogger<AuthService> _logger;
  private readonly IMapper _mapper;
  private readonly ICodeGeneratorService _codeGenerator;

  public AuthService(
    IUserRepository userRepository,
    IRepository<Subject> subjectRepository,
    IRepository<TutorSubject> tutorSubjectRepository,
    IRepository<TutorTeachingLevel> tutorTeachingLevelRepository,
    IFileService fileService,
    IConfiguration config,
    ILogger<AuthService> logger,
    IMapper mapper,
    ICodeGeneratorService codeGenerator)
  {
    _userRepository = userRepository;
    _subjectRepository = subjectRepository;
    _tutorSubjectRepository = tutorSubjectRepository;
    _tutorTeachingLevelRepository = tutorTeachingLevelRepository;
    _fileService = fileService;
    _config = config;
    _logger = logger;
    _mapper = mapper;
    _codeGenerator = codeGenerator;
  }

  public Task<LoginResponseDto> RegisterStudentAsync(RegisterStudentDto dto)
  {
    return RegisterAsync(dto, null);
  }

  public Task<LoginResponseDto> RegisterTutorAsync(RegisterTutorDto dto)
  {
    return RegisterAsync(dto, dto);
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
        IsGoogleAccount = true,
        IsActive = true,
        StudentProfile = CreateStudentProfile(null)
      };

      if (!string.IsNullOrWhiteSpace(payload.Picture))
      {
        var avatarFile = await _fileService.CreateAvatarReferenceAsync(payload.Picture, $"google-avatar-{Guid.NewGuid():N}");
        user.AvatarFileId = avatarFile.Id;
        user.AvatarFile = avatarFile;
      }

      await _userRepository.AddAsync(user);
      await _userRepository.SaveChangesAsync();

      AssignProfileCode(user);
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
      User = _mapper.Map<UserDto>(user)
    };
  }

  public async Task<LoginResponseDto> LoginAsync(LoginDto dto)
  {
    var user = await _userRepository.GetByEmailWithProfilesAsync(dto.Email);

    if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
    {
      throw new AppException("Email hoặc mật khẩu không đúng", 401);
    }

    _logger.LogInformation("User logged in: {Email} | Id: {Id}", user.Email, user.Id);

    return await IssueTokenPairAsync(user);
  }

  public async Task<LoginResponseDto> RefreshTokenAsync(RefreshTokenDto dto)
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

    var user = await _userRepository.GetByRefreshTokenWithProfilesAsync(dto.RefreshToken);

    if (user == null || user.RefreshTokenExpiryTime == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
    {
      throw new AppException("Invalid access token or refresh token", 400);
    }

    if (!string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase))
    {
      throw new AppException("Invalid access token or refresh token", 400);
    }

    return await IssueTokenPairAsync(user, dto.RefreshToken);
  }

  public async Task LogoutAsync(LogoutDto dto)
  {
    var user = await _userRepository.GetByRefreshTokenWithProfilesAsync(dto.RefreshToken);
    if (user == null)
    {
      _logger.LogInformation("Logout requested with unknown refresh token");
      return;
    }

    await InvalidateRefreshTokenAsync(user);
    _logger.LogInformation("Refresh token invalidated for UserId={UserId}", user.Id);
  }

  private async Task<LoginResponseDto> RegisterAsync(RegisterDto dto, RegisterTutorDto? tutorDto)
  {
    var role = tutorDto == null ? UserRole.Student : UserRole.Tutor;

    ValidateRegisterDto(dto, tutorDto);

    var normalizedEmail = dto.Email.ToLower().Trim();
    var normalizedPhoneNumber = dto.PhoneNumber.Trim();

    if (await _userRepository.ExistsAsync(u => u.Email == normalizedEmail))
    {
      throw new AppException("Email đã được sử dụng");
    }

    if (await _userRepository.ExistsAsync(u => u.PhoneNumber == normalizedPhoneNumber))
    {
      throw new AppException("Số điện thoại đã được sử dụng");
    }

    var hashedPassword = BCrypt.Net.BCrypt.HashPassword(dto.Password, workFactor: 12);

    FileEntity? avatarFile = null;
    FileEntity? cvFile = null;

    if (dto is RegisterStudentDto studentDto && studentDto.Avatar != null)
    {
      avatarFile = await _fileService.UploadAvatarAsync(studentDto.Avatar);
    }
    else if (tutorDto != null)
    {
      avatarFile = await _fileService.UploadAvatarAsync(tutorDto.Avatar!);
      cvFile = await _fileService.UploadCvAsync(tutorDto.Cv!);
    }

    var user = new User
    {
      FullName = dto.FullName.Trim(),
      Email = normalizedEmail,
      PhoneNumber = normalizedPhoneNumber,
      Password = hashedPassword,
      Role = role,
      Gender = dto.Gender!.Value,
      IsActive = true,
      AvatarFileId = avatarFile?.Id,
      AvatarFile = avatarFile
    };

    switch (role)
    {
      case UserRole.Student:
        user.StudentProfile = CreateStudentProfile(dto.Address);
        break;
      case UserRole.Tutor:
        user.TutorProfile = CreateTutorProfile(tutorDto!, cvFile);
        break;
      default:
        throw new AppException("Unsupported registration role", 400);
    }

    await _userRepository.AddAsync(user);
    await _userRepository.SaveChangesAsync();

    AssignProfileCode(user);
    await _userRepository.SaveChangesAsync();

    if (tutorDto != null && user.TutorProfile != null)
    {
      await CreateTutorSubjectsAsync(user.TutorProfile, tutorDto.SubjectIds);
      await CreateTutorTeachingLevelsAsync(user.TutorProfile, tutorDto.TeachingLevels);
      await _userRepository.SaveChangesAsync();
    }

    _logger.LogInformation("{Role} registered: {Email} | Id: {Id}", role, user.Email, user.Id);

    return await IssueTokenPairAsync(user);
  }

  private void ValidateRegisterDto(RegisterDto dto, RegisterTutorDto? tutorDto)
  {
    var errors = new Dictionary<string, string[]>();

    if (dto.Gender == null)
    {
      errors[nameof(dto.Gender)] = ["Giới tính là bắt buộc."];
    }

    if (dto.Address == null)
    {
      errors[nameof(dto.Address)] = ["Địa chỉ là bắt buộc."];
    }

    if (tutorDto != null)
    {
      if (tutorDto.Avatar == null)
      {
        errors[nameof(tutorDto.Avatar)] = ["Ảnh đại diện là bắt buộc."];
      }

      if (tutorDto.Cv == null)
      {
        errors[nameof(tutorDto.Cv)] = ["CV là bắt buộc."];
      }

      if (string.IsNullOrWhiteSpace(tutorDto.Bio))
      {
        errors[nameof(tutorDto.Bio)] = ["Mô tả kinh nghiệm là bắt buộc."];
      }

      if (tutorDto.HourlyRate <= 0)
      {
        errors[nameof(tutorDto.HourlyRate)] = ["Mức lương phải lớn hơn 0."];
      }

      if (tutorDto.SubjectIds == null || tutorDto.SubjectIds.Count == 0)
      {
        errors[nameof(tutorDto.SubjectIds)] = ["Phải chọn ít nhất một môn dạy."];
      }

      if (tutorDto.TeachingLevels == null || tutorDto.TeachingLevels.Count == 0)
      {
        errors[nameof(tutorDto.TeachingLevels)] = ["Phải chọn ít nhất một lớp dạy."];
      }

      if (tutorDto.CareerStatus == null)
      {
        errors[nameof(tutorDto.CareerStatus)] = ["Trạng thái gia sư là bắt buộc."];
      }

      if (string.IsNullOrWhiteSpace(tutorDto.Major))
      {
        errors[nameof(tutorDto.Major)] = ["Ngành học là bắt buộc."];
      }

      if (tutorDto.AcademicDegree == null)
      {
        errors[nameof(tutorDto.AcademicDegree)] = ["Trình độ học vấn là bắt buộc."];
      }
    }

    if (errors.Count > 0)
    {
      throw new ValidationException(errors);
    }
  }

  private Student CreateStudentProfile(DTOs.Address.CreateAddressDto? addressDto)
  {
    return new Student
    {
      Code = _codeGenerator.GenerateTemporaryCode("STU"),
      Bio = string.Empty,
      School = string.Empty,
      GradeLevel = null,
      Address = addressDto == null ? null : _mapper.Map<Address>(addressDto)
    };
  }

  private Tutor CreateTutorProfile(RegisterTutorDto dto, FileEntity? cvFile)
  {
    return new Tutor
    {
      Code = _codeGenerator.GenerateTemporaryCode("TUT"),
      Bio = dto.Bio.Trim(),
      HourlyRate = dto.HourlyRate,
      CareerStatus = dto.CareerStatus,
      Major = dto.Major.Trim(),
      AcademicDegree = dto.AcademicDegree,
      Address = dto.Address == null ? null : _mapper.Map<Address>(dto.Address),
      CvFileId = cvFile?.Id,
      CvFile = cvFile
    };
  }

  private async Task CreateTutorSubjectsAsync(Tutor tutorProfile, IEnumerable<long> subjectIds)
  {
    var distinctSubjectIds = subjectIds
      .Distinct()
      .ToList();

    var validSubjects = await _subjectRepository.FindAsync(subject => distinctSubjectIds.Contains(subject.Id));
    var validSubjectIds = validSubjects
      .Select(subject => subject.Id)
      .ToHashSet();

    var invalidSubjectIds = distinctSubjectIds
      .Where(subjectId => !validSubjectIds.Contains(subjectId))
      .ToArray();

    if (invalidSubjectIds.Length > 0)
    {
      throw new ValidationException(
        new Dictionary<string, string[]>
        {
          [nameof(RegisterTutorDto.SubjectIds)] = [$"Các môn học không tồn tại: {string.Join(", ", invalidSubjectIds)}."]
        },
        "INVALID_TUTOR_SUBJECTS");
    }

    foreach (var subjectId in distinctSubjectIds)
    {
      await _tutorSubjectRepository.AddAsync(new TutorSubject
      {
        TutorId = tutorProfile.Id,
        SubjectId = subjectId
      });
    }
  }

  private async Task CreateTutorTeachingLevelsAsync(Tutor tutorProfile, IEnumerable<EducationLevel> teachingLevels)
  {
    foreach (var teachingLevel in teachingLevels.Distinct())
    {
      await _tutorTeachingLevelRepository.AddAsync(new TutorTeachingLevel
      {
        TutorId = tutorProfile.Id,
        TeachingLevel = teachingLevel
      });
    }
  }

  private void AssignProfileCode(User user)
  {
    if (user.StudentProfile != null)
    {
      user.StudentProfile.Code = _codeGenerator.GenerateStudentCode(user.StudentProfile.Id);
    }

    if (user.TutorProfile != null)
    {
      user.TutorProfile.Code = _codeGenerator.GenerateTutorCode(user.TutorProfile.Id);
    }
  }

  private async Task<LoginResponseDto> IssueTokenPairAsync(User user, string? currentRefreshToken = null)
  {
    if (!string.IsNullOrWhiteSpace(currentRefreshToken) &&
        !string.Equals(user.RefreshToken, currentRefreshToken, StringComparison.Ordinal))
    {
      throw new AppException("Invalid access token or refresh token", 400);
    }

    var accessToken = GenerateJwtToken(user);
    var newRefreshToken = GenerateRefreshToken();

    user.RefreshToken = newRefreshToken;
    user.RefreshTokenExpiryTime = DateTime.UtcNow.Add(RefreshTokenLifetime);

    _userRepository.Update(user);
    await _userRepository.SaveChangesAsync();

    return new LoginResponseDto
    {
      AccessToken = accessToken,
      RefreshToken = newRefreshToken,
      User = _mapper.Map<UserDto>(user)
    };
  }

  private async Task InvalidateRefreshTokenAsync(User user)
  {
    user.RefreshToken = null;
    user.RefreshTokenExpiryTime = null;

    _userRepository.Update(user);
    await _userRepository.SaveChangesAsync();
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
      signingCredentials: credentials);

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

    if (securityToken is not JwtSecurityToken jwtSecurityToken ||
        !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
    {
      throw new SecurityTokenException("Invalid token");
    }

    return principal;
  }
}
