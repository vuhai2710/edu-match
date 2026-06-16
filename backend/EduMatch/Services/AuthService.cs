using AutoMapper;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.DTOs.Address;
using EduMatch.DTOs;
using EduMatch.DTOs.Auth;
using EduMatch.DTOs.User;
using EduMatch.Models;
using EduMatch.Repositories;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using EduMatch.Data;
using Google.Apis.Auth;
using Microsoft.IdentityModel.Tokens;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using FileEntity = EduMatch.Models.File;

namespace EduMatch.Services;

public class AuthService
{
  private static readonly TimeSpan RefreshTokenLifetime = TimeSpan.FromDays(7);
  private const string GoogleTokenInfoUrl = "https://www.googleapis.com/oauth2/v3/tokeninfo";
  private const string GoogleUserInfoUrl = "https://openidconnect.googleapis.com/v1/userinfo";
  private readonly IConfiguration _config;
  private readonly IFileService _fileService;
  private readonly IUserRepository _userRepository;
  private readonly IRepository<Subject> _subjectRepository;
  private readonly IRepository<TutorSubject> _tutorSubjectRepository;
  private readonly IRepository<TutorTeachingLevel> _tutorTeachingLevelRepository;
  private readonly ILogger<AuthService> _logger;
  private readonly IMapper _mapper;
  private readonly ICodeGeneratorService _codeGenerator;
  private readonly IHttpClientFactory _httpClientFactory;
  private readonly AppDbContext _db;
  private readonly INotificationService _notificationService;

  public AuthService(
    IUserRepository userRepository,
    IRepository<Subject> subjectRepository,
    IRepository<TutorSubject> tutorSubjectRepository,
    IRepository<TutorTeachingLevel> tutorTeachingLevelRepository,
    IFileService fileService,
    IConfiguration config,
    ILogger<AuthService> logger,
    IMapper mapper,
    ICodeGeneratorService codeGenerator,
    IHttpClientFactory httpClientFactory,
    AppDbContext db,
    INotificationService notificationService)
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
    _httpClientFactory = httpClientFactory;
    _db = db;
    _notificationService = notificationService;
  }

  public Task<LoginResponseDto> RegisterStudentAsync(RegisterStudentDto dto)
  {
    return RegisterAsync(dto, null);
  }

  public Task<LoginResponseDto> RegisterTutorAsync(RegisterTutorDto dto)
  {
    return RegisterAsync(dto, dto);
  }

  public Task<LoginResponseDto> RegisterTutorCompleteAsync(RegisterTutorCompleteDto dto)
  {
    return RegisterAsync(dto, null, dto);
  }

  public Task<ApiResponse<LoginResponseDto>> RegisterStudentResponseAsync(RegisterStudentDto dto)
  {
    return ServiceResponse.ExecuteAsync(async () =>
    {
      var loginResponse = await RegisterStudentAsync(dto);
      return ApiResponse<LoginResponseDto>.SuccessResult(loginResponse, "Đăng ký học viên thành công", StatusCodes.Status200OK);
    });
  }

  public Task<ApiResponse<LoginResponseDto>> RegisterTutorResponseAsync(RegisterTutorDto dto)
  {
    return ServiceResponse.ExecuteAsync(async () =>
    {
      var loginResponse = await RegisterTutorAsync(dto);
      return ApiResponse<LoginResponseDto>.SuccessResult(loginResponse, "Đăng ký gia sư thành công", StatusCodes.Status200OK);
    });
  }

  public Task<ApiResponse<LoginResponseDto>> GoogleLoginResponseAsync(GoogleLoginRequestDto dto)
  {
    return ServiceResponse.ExecuteAsync(async () =>
    {
      var loginResponse = await GoogleLoginAsync(dto);
      return ApiResponse<LoginResponseDto>.SuccessResult(loginResponse, "Đăng nhập Google thành công", StatusCodes.Status200OK);
    });
  }

  public Task<ApiResponse<LoginResponseDto>> RegisterTutorCompleteResponseAsync(RegisterTutorCompleteDto dto)
  {
    return ServiceResponse.ExecuteAsync(async () =>
    {
      var loginResponse = await RegisterTutorCompleteAsync(dto);
      return ApiResponse<LoginResponseDto>.SuccessResult(loginResponse, "Đăng ký gia sư thành công", StatusCodes.Status200OK);
    });
  }

  public Task<ApiResponse<LoginResponseDto>> LoginResponseAsync(LoginDto dto)
  {
    return ServiceResponse.ExecuteAsync(() => LoginAsync(dto));
  }

  public async Task<LoginResponseDto> GoogleLoginAsync(GoogleLoginRequestDto dto)
  {
    var payload = await GetGooglePayloadAsync(dto);
    var normalizedEmail = payload.Email.ToLower().Trim();
    var isRegistrationRequest = IsGoogleRegistrationRequest(dto);

    var user = await _userRepository.GetByEmailWithProfilesAsync(normalizedEmail);

    if (user != null)
    {
      if (isRegistrationRequest)
      {
        throw new AppException("Tài khoản đã tồn tại", 400, "GOOGLE_ACCOUNT_EXISTS");
      }

      user = await LinkGoogleAccountAsync(user);
    }
    else
    {
      user = await CreateGoogleUserAsync(payload, dto);
    }

    if (user.Role == UserRole.Tutor && user.Tutor != null)
    {
      if (user.Tutor.ApprovalStatus == TutorApprovalStatus.Pending)
      {
        throw new AppException("Tài khoản gia sư của bạn đang chờ quản trị viên phê duyệt.", 400, "TUTOR_PENDING_APPROVAL");
      }
      if (user.Tutor.ApprovalStatus == TutorApprovalStatus.Rejected)
      {
        throw new AppException("Tài khoản gia sư của bạn đã bị từ chối phê duyệt.", 400, "TUTOR_REJECTED");
      }
    }

    _logger.LogInformation("Google login: {Email} | Id: {Id}", user.Email, user.Id);
    return await IssueTokenPairAsync(user);
  }

  private async Task<GoogleUserPayload> GetGooglePayloadAsync(GoogleLoginRequestDto dto)
  {
    if (!string.IsNullOrWhiteSpace(dto.IdToken))
    {
      return await ValidateGoogleIdTokenAsync(dto.IdToken);
    }

    if (!string.IsNullOrWhiteSpace(dto.AccessToken))
    {
      return await ValidateGoogleAccessTokenAsync(dto.AccessToken);
    }

    throw new AppException("Cần cung cấp token từ Google", 400, "GOOGLE_TOKEN_REQUIRED");
  }

  private async Task<GoogleUserPayload> ValidateGoogleIdTokenAsync(string idToken)
  {
    if (string.IsNullOrWhiteSpace(idToken))
    {
      throw new AppException("Cần cung cấp token từ Google", 400, "GOOGLE_TOKEN_REQUIRED");
    }

    var googleClientId = _config["GoogleAuth:ClientId"] ?? _config["GoogleAuth__ClientId"];
    if (string.IsNullOrWhiteSpace(googleClientId))
    {
      throw new AppException("Chưa cấu hình xác thực bằng Google", 500, "GOOGLE_AUTH_NOT_CONFIGURED");
    }

    try
    {
      var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
      {
        Audience = new[] { googleClientId }
      });

      return new GoogleUserPayload(payload.Email, payload.Name, payload.Picture);
    }
    catch (InvalidJwtException ex)
    {
      _logger.LogError(ex, "Invalid Google token");
      throw new AppException("Google token không hợp lệ", 401);
    }
    catch (System.Exception ex)
    {
      _logger.LogError(ex, "Error validating Google token");
      throw new AppException("Lỗi khi xác thực bằng Google", 401);
    }
  }

  private async Task<GoogleUserPayload> ValidateGoogleAccessTokenAsync(string accessToken)
  {
    var googleClientId = _config["GoogleAuth:ClientId"] ?? _config["GoogleAuth__ClientId"];
    if (string.IsNullOrWhiteSpace(googleClientId))
    {
      throw new AppException("Chưa cấu hình xác thực bằng Google", 500, "GOOGLE_AUTH_NOT_CONFIGURED");
    }

    try
    {
      var http = _httpClientFactory.CreateClient();
      using var tokenInfoResponse = await http.GetAsync(
        $"{GoogleTokenInfoUrl}?access_token={Uri.EscapeDataString(accessToken)}");

      if (!tokenInfoResponse.IsSuccessStatusCode)
      {
        throw new AppException("Google access token không hợp lệ", 401, "GOOGLE_ACCESS_TOKEN_INVALID");
      }

      var tokenInfo = await tokenInfoResponse.Content.ReadFromJsonAsync<GoogleTokenInfo>();
      var audience = tokenInfo?.Audience ?? tokenInfo?.Aud ?? tokenInfo?.IssuedTo;
      if (!string.Equals(audience, googleClientId, StringComparison.Ordinal))
      {
        throw new AppException("Google token audience không hợp lệ", 401, "GOOGLE_TOKEN_AUDIENCE_INVALID");
      }

      using var request = new HttpRequestMessage(HttpMethod.Get, GoogleUserInfoUrl);
      request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

      using var response = await http.SendAsync(request);
      if (!response.IsSuccessStatusCode)
      {
        throw new AppException("Google access token không hợp lệ", 401, "GOOGLE_ACCESS_TOKEN_INVALID");
      }

      var profile = await response.Content.ReadFromJsonAsync<GoogleUserInfo>();
      if (string.IsNullOrWhiteSpace(profile?.Email))
      {
        throw new AppException("Cần có email tài khoản Google", 401, "GOOGLE_EMAIL_REQUIRED");
      }

      if (profile.EmailVerified == false)
      {
        throw new AppException("Email tài khoản Google chưa được xác minh", 401, "GOOGLE_EMAIL_NOT_VERIFIED");
      }

      return new GoogleUserPayload(profile.Email, profile.Name ?? profile.Email, profile.Picture);
    }
    catch (AppException)
    {
      throw;
    }
    catch (HttpRequestException ex)
    {
      _logger.LogError(ex, "Cannot call Google token validation endpoints");
      throw new AppException("Không thể xác minh Google access token", 503, "GOOGLE_TOKEN_VERIFY_FAILED");
    }
    catch (JsonException ex)
    {
      _logger.LogError(ex, "Invalid Google token validation response");
      throw new AppException("Phản hồi token từ Google không hợp lệ", 401, "GOOGLE_TOKEN_RESPONSE_INVALID");
    }
  }

  private async Task<User> CreateGoogleUserAsync(
    GoogleUserPayload payload,
    GoogleLoginRequestDto dto)
  {
    var isRegistrationRequest = IsGoogleRegistrationRequest(dto);
    var role = isRegistrationRequest ? dto.RequestedRole!.Value : UserRole.Student;

    if (role == UserRole.Admin)
    {
      throw new AppException("Không hỗ trợ đăng ký tài khoản admin qua Google", 400, "GOOGLE_ADMIN_NOT_ALLOWED");
    }

    if (role == UserRole.Tutor)
    {
      throw new AppException("Không hỗ trợ đăng ký tài khoản gia sư bằng Google.", 400, "GOOGLE_TUTOR_REGISTRATION_NOT_SUPPORTED");
    }

    var normalizedEmail = payload.Email.ToLower().Trim();
    var existingUser = await GetUserByEmailWithProfilesAsync(normalizedEmail, ignoreQueryFilters: true);
    if (existingUser != null)
    {
      if (existingUser.IsDeleted)
      {
        await ReleaseRegistrationIdentityAsync(existingUser);
      }
      else if (isRegistrationRequest)
      {
        throw new AppException("Tài khoản đã tồn tại", 400, "GOOGLE_ACCOUNT_EXISTS");
      }
      else
      {
        return await LinkGoogleAccountAsync(existingUser);
      }
    }

    var user = new User
    {
      FullName = string.IsNullOrWhiteSpace(payload.Name) ? payload.Email : payload.Name.Trim(),
      Email = normalizedEmail,
      Password = BCrypt.Net.BCrypt.HashPassword(GenerateRefreshToken(), workFactor: 12),
      Role = role,
      IsGoogleAccount = true,
      IsActive = true
    };

    if (!string.IsNullOrWhiteSpace(payload.Picture))
    {
      var avatarFile = await _fileService.CreateAvatarReferenceAsync(payload.Picture, $"google-avatar-{Guid.NewGuid():N}");
      user.AvatarFileId = avatarFile.Id;
      user.AvatarFile = avatarFile;
    }

    switch (role)
    {
      case UserRole.Student:
        user.Student = CreateStudentProfile(null);
        break;
      case UserRole.Tutor:
        user.Tutor = CreateMinimalTutorProfile();
        break;
      default:
        throw new AppException("Vai trò tạo tài khoản không được hỗ trợ", 400);
    }

    try
    {
      await _userRepository.AddAsync(user);
      await _userRepository.SaveChangesAsync();
    }
    catch (DbUpdateException ex) when (IsUniqueEmailViolation(ex))
    {
      DetachGoogleUserGraph(user);
      var duplicateUser = await GetUserByEmailWithProfilesAsync(normalizedEmail, ignoreQueryFilters: true);
      if (duplicateUser?.IsDeleted == true)
      {
        await ReleaseRegistrationIdentityAsync(duplicateUser);
        await _userRepository.AddAsync(user);
        await _userRepository.SaveChangesAsync();
      }
      else if (isRegistrationRequest || duplicateUser == null)
      {
        throw new AppException("Tài khoản đã tồn tại", 400, "GOOGLE_ACCOUNT_EXISTS");
      }
      else
      {
        return await LinkGoogleAccountAsync(duplicateUser);
      }
    }

    AssignProfileCode(user);
    await _userRepository.SaveChangesAsync();

    _logger.LogInformation("New {Role} user created via Google: {Email} | Id: {Id}", role, user.Email, user.Id);
    return user;
  }

  private static bool IsGoogleRegistrationRequest(GoogleLoginRequestDto dto)
  {
    return dto.RegistrationIntent && dto.RequestedRole.HasValue;
  }

  private static bool IsUniqueEmailViolation(DbUpdateException ex)
  {
    return ex.InnerException is PostgresException postgresException &&
      postgresException.SqlState == PostgresErrorCodes.UniqueViolation &&
      string.Equals(postgresException.ConstraintName, "IX_Users_Email", StringComparison.Ordinal);
  }

  private void DetachGoogleUserGraph(User user)
  {
    _db.Entry(user).State = EntityState.Detached;

    if (user.Student != null)
    {
      _db.Entry(user.Student).State = EntityState.Detached;
    }

    if (user.Tutor != null)
    {
      _db.Entry(user.Tutor).State = EntityState.Detached;
    }
  }

  private async Task<User?> GetUserByEmailWithProfilesAsync(string normalizedEmail, bool ignoreQueryFilters = false)
  {
    var query = _db.Users.AsQueryable();
    if (ignoreQueryFilters)
    {
      query = query.IgnoreQueryFilters();
    }

    return await query
      .Include(u => u.AvatarFile)
      .Include(u => u.Tutor)
      .Include(u => u.Student)
      .FirstOrDefaultAsync(u => u.Email == normalizedEmail);
  }

  private async Task<User> LinkGoogleAccountAsync(User user)
  {
    if (!user.IsGoogleAccount)
    {
      user.IsGoogleAccount = true;
      _userRepository.Update(user);
      await _userRepository.SaveChangesAsync();
    }

    return user;
  }

  public async Task<ApiResponse<LoginResponseDto>> LoginAsync(LoginDto dto)
  {
    var user = await _userRepository.GetByEmailWithProfilesAsync(dto.Email);

    if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.Password))
    {
      return ApiResponse<LoginResponseDto>.Fail("Email hoặc mật khẩu không đúng", 401);
    }

    if (user.Role == UserRole.Tutor && user.Tutor != null)
    {
      if (user.Tutor.ApprovalStatus == TutorApprovalStatus.Pending)
      {
        throw new AppException("Tài khoản gia sư của bạn đang chờ quản trị viên phê duyệt.", 400, "TUTOR_PENDING_APPROVAL");
      }
      if (user.Tutor.ApprovalStatus == TutorApprovalStatus.Rejected)
      {
        throw new AppException("Tài khoản gia sư của bạn đã bị từ chối phê duyệt.", 400, "TUTOR_REJECTED");
      }
    }

    _logger.LogInformation("User logged in: {Email} | Id: {Id}", user.Email, user.Id);

    var loginResponse = await IssueTokenPairAsync(user);
    return ApiResponse<LoginResponseDto>.SuccessResult(loginResponse, "Đăng nhập thành công", StatusCodes.Status200OK);
  }

  public async Task<LoginResponseDto> RefreshTokenAsync(RefreshTokenDto dto)
  {
    var accessToken = dto.AccessToken?.Trim();
    var refreshToken = dto.RefreshToken?.Trim();

    if (string.IsNullOrWhiteSpace(accessToken) || string.IsNullOrWhiteSpace(refreshToken))
    {
      throw new AppException("Access token hoặc refresh token không hợp lệ", 400);
    }

    ClaimsPrincipal principal;
    try
    {
      principal = GetPrincipalFromExpiredToken(accessToken)
        ?? throw new SecurityTokenException("Token không hợp lệ");
    }
    catch (System.Exception ex) when (ex is SecurityTokenException or ArgumentException)
    {
      throw new AppException("Access token hoặc refresh token không hợp lệ", 400);
    }

    var email = principal.FindFirst(ClaimTypes.Email)?.Value;
    if (string.IsNullOrEmpty(email))
    {
      throw new AppException("Dữ liệu token không hợp lệ", 400);
    }

    var user = await _userRepository.GetByRefreshTokenWithProfilesAsync(refreshToken);

    if (user == null || user.RefreshTokenExpiryTime == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
    {
      throw new AppException("Access token hoặc refresh token không hợp lệ", 400);
    }

    if (!string.Equals(user.Email, email, StringComparison.OrdinalIgnoreCase))
    {
      throw new AppException("Access token hoặc refresh token không hợp lệ", 400);
    }

    return await IssueTokenPairAsync(user, refreshToken, rotateRefreshToken: false);
  }

  public Task<ApiResponse<LoginResponseDto>> RefreshTokenResponseAsync(RefreshTokenDto dto)
  {
    return ServiceResponse.ExecuteAsync(async () =>
    {
      var loginResponse = await RefreshTokenAsync(dto);
      return ApiResponse<LoginResponseDto>.SuccessResult(loginResponse, "Refresh token Thành công", StatusCodes.Status200OK);
    });
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

  private async Task<LoginResponseDto> RegisterAsync(RegisterDto dto, RegisterTutorDto? tutorDto, RegisterTutorCompleteDto? tutorCompleteDto = null)
  {
    var role = tutorDto == null && tutorCompleteDto == null ? UserRole.Student : UserRole.Tutor;

    ValidateRegisterDto(dto, tutorDto, tutorCompleteDto);

    var normalizedEmail = dto.Email.ToLower().Trim();
    var normalizedPhoneNumber = dto.PhoneNumber.Trim();

    var existingUsers = await _db.Users
        .IgnoreQueryFilters()
        .Include(u => u.Tutor)
        .Where(u => u.Email == normalizedEmail || u.PhoneNumber == normalizedPhoneNumber)
        .ToListAsync();

    var existingUserByEmail = existingUsers
        .FirstOrDefault(u => string.Equals(u.Email, normalizedEmail, StringComparison.Ordinal));

    var existingUserByPhone = existingUsers
        .FirstOrDefault(u => string.Equals(u.PhoneNumber, normalizedPhoneNumber, StringComparison.Ordinal));

    if (existingUserByEmail != null || existingUserByPhone != null)
    {
      if (existingUserByEmail != null && !CanReuseRegistrationIdentity(existingUserByEmail))
      {
        throw new AppException("Email đã được sử dụng");
      }

      if (existingUserByPhone != null && !CanReuseRegistrationIdentity(existingUserByPhone))
      {
        throw new AppException("Số điện thoại đã được sử dụng");
      }

      var reusableUsers = existingUsers
        .Where(CanReuseRegistrationIdentity)
        .DistinctBy(u => u.Id)
        .ToList();

      foreach (var reusableUser in reusableUsers)
      {
        await ReleaseRegistrationIdentityAsync(reusableUser);
      }
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
    else if (tutorCompleteDto != null)
    {
      avatarFile = await _fileService.ClaimRegistrationUploadAsync(
        tutorCompleteDto.AvatarFileId,
        tutorCompleteDto.AvatarUploadToken,
        "registration-avatar");
      cvFile = await _fileService.ClaimRegistrationUploadAsync(
        tutorCompleteDto.CvFileId,
        tutorCompleteDto.CvUploadToken,
        "registration-cv");
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
        var gradeLevel = (dto as RegisterStudentDto)?.GradeLevel;
        user.Student = CreateStudentProfile(BuildAddressDto(dto), gradeLevel);
        break;
      case UserRole.Tutor:
        user.Tutor = tutorDto != null
          ? CreateTutorProfile(tutorDto, cvFile)
          : CreateTutorProfile(tutorCompleteDto!, cvFile);
        break;
      default:
        throw new AppException("Vai trò đăng ký không được hỗ trợ", 400);
    }

    await _userRepository.AddAsync(user);
    await _userRepository.SaveChangesAsync();

    AssignProfileCode(user);

    if (user.Tutor != null)
    {
      IEnumerable<long> subjectIds = tutorDto?.SubjectIds
        ?? tutorCompleteDto?.SubjectIds
        ?? Enumerable.Empty<long>();
      IEnumerable<EducationLevel> teachingLevels = tutorDto?.TeachingLevels
        ?? tutorCompleteDto?.TeachingLevels
        ?? Enumerable.Empty<EducationLevel>();
      await CreateTutorSubjectsAsync(user.Tutor, subjectIds);
      await CreateTutorTeachingLevelsAsync(user.Tutor, teachingLevels);
    }

    await _userRepository.SaveChangesAsync();

    _logger.LogInformation("{Role} registered: {Email} | Id: {Id}", role, user.Email, user.Id);

    if (role == UserRole.Tutor)
    {
      // Notify all admins about new tutor registration
      var adminIds = await _db.Users
        .Where(u => u.Role == UserRole.Admin && !u.IsDeleted)
        .Select(u => u.Id)
        .ToListAsync();

      await _notificationService.SendToMultipleAsync(
        adminIds,
        "Yêu cầu đăng ký gia sư mới",
        $"{user.FullName} vừa gửi yêu cầu đăng ký trở thành gia sư. Vui lòng xem xét và phê duyệt.",
        NotificationType.BecomeTutorRequest,
        "Tutor",
        user.Tutor!.Id,
        $"/admin/users/{user.Id}");

      throw new AppException("Đăng ký tài khoản gia sư thành công. Vui lòng chờ quản trị viên phê duyệt hồ sơ của bạn.", 400, "TUTOR_REGISTRATION_PENDING");
    }

    return await IssueTokenPairAsync(user);
  }

  private static bool CanReuseRegistrationIdentity(User user)
  {
    return user.IsDeleted ||
      user.Tutor?.IsDeleted == true ||
      user.Tutor?.ApprovalStatus == TutorApprovalStatus.Rejected;
  }

  private async Task ReleaseRegistrationIdentityAsync(User user)
  {
    var userToRelease = await _db.Users
      .IgnoreQueryFilters()
      .Include(u => u.Tutor)
      .Include(u => u.Student)
      .FirstOrDefaultAsync(u => u.Id == user.Id) ?? user;

    userToRelease.Email = BuildArchivedEmail(userToRelease);
    userToRelease.PhoneNumber = null;
    userToRelease.RefreshToken = null;
    userToRelease.RefreshTokenExpiryTime = null;
    userToRelease.IsActive = false;
    userToRelease.IsDeleted = true;

    if (userToRelease.Tutor != null)
    {
      userToRelease.Tutor.IsDeleted = true;
    }

    if (userToRelease.Student != null)
    {
      userToRelease.Student.IsDeleted = true;
    }

    _db.Users.Update(userToRelease);
    await _db.SaveChangesAsync();
  }

  private static string BuildArchivedEmail(User user)
  {
    return $"deleted-{user.Id}-{Guid.NewGuid():N}@deleted.local";
  }

  private async Task HardDeleteUserAsync(User user)
  {
    var userToDelete = await _db.Users
      .IgnoreQueryFilters()
      .Include(u => u.Tutor)
      .Include(u => u.Student)
      .FirstOrDefaultAsync(u => u.Id == user.Id) ?? user;

    if (userToDelete.Tutor != null)
    {
      var tutor = await _db.Tutors
          .IgnoreQueryFilters()
          .Include(t => t.TutorSubjects)
          .Include(t => t.TeachingLevels)
          .Include(t => t.Address)
          .FirstOrDefaultAsync(t => t.Id == userToDelete.Tutor.Id);

      if (tutor != null)
      {
        if (tutor.TutorSubjects.Any())
        {
          _db.TutorSubjects.RemoveRange(tutor.TutorSubjects);
        }
        if (tutor.TeachingLevels.Any())
        {
          _db.TutorTeachingLevels.RemoveRange(tutor.TeachingLevels);
        }
        if (tutor.Address != null)
        {
          _db.Addresses.Remove(tutor.Address);
        }
        if (tutor.CvFileId.HasValue)
        {
          var cvFile = await _db.Files.FindAsync(tutor.CvFileId.Value);
          if (cvFile != null)
          {
            _db.Files.Remove(cvFile);
          }
        }
        _db.Tutors.Remove(tutor);
      }
    }

    if (userToDelete.Student != null)
    {
      var student = await _db.Students
          .IgnoreQueryFilters()
          .Include(s => s.Address)
          .FirstOrDefaultAsync(s => s.Id == userToDelete.Student.Id);
      if (student != null)
      {
        if (student.Address != null)
        {
          _db.Addresses.Remove(student.Address);
        }
        _db.Students.Remove(student);
      }
    }

    var passwordTokens = await _db.PasswordResetTokens.IgnoreQueryFilters().Where(t => t.UserId == userToDelete.Id).ToListAsync();
    if (passwordTokens.Any())
    {
      _db.PasswordResetTokens.RemoveRange(passwordTokens);
    }

    var notifications = await _db.Notifications.IgnoreQueryFilters().Where(n => n.UserId == userToDelete.Id).ToListAsync();
    if (notifications.Any())
    {
      _db.Notifications.RemoveRange(notifications);
    }

    var sentMessages = await _db.Messages.IgnoreQueryFilters().Where(m => m.SenderId == userToDelete.Id).ToListAsync();
    if (sentMessages.Any())
    {
      _db.Messages.RemoveRange(sentMessages);
    }

    var receivedMessages = await _db.Messages.IgnoreQueryFilters().Where(m => m.ReceiverId == userToDelete.Id).ToListAsync();
    if (receivedMessages.Any())
    {
      _db.Messages.RemoveRange(receivedMessages);
    }

    if (userToDelete.AvatarFileId.HasValue)
    {
      var avatarFile = await _db.Files.IgnoreQueryFilters().FirstOrDefaultAsync(file => file.Id == userToDelete.AvatarFileId.Value);
      if (avatarFile != null)
      {
        _db.Files.Remove(avatarFile);
      }
    }

    _db.Users.Remove(userToDelete);
    await _db.SaveChangesAsync();
  }

  private void ValidateRegisterDto(RegisterDto dto, RegisterTutorDto? tutorDto, RegisterTutorCompleteDto? tutorCompleteDto = null)
  {
    var errors = new Dictionary<string, string[]>();

    if (dto.Gender == null)
    {
      errors[nameof(dto.Gender)] = ["Giới tính là bắt buộc."];
    }

    ValidateAddress(dto, errors);

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

    if (tutorCompleteDto != null)
    {
      if (tutorCompleteDto.AvatarFileId <= 0)
      {
        errors[nameof(tutorCompleteDto.AvatarFileId)] = ["Ảnh đại diện là bắt buộc."];
      }

      if (string.IsNullOrWhiteSpace(tutorCompleteDto.AvatarUploadToken))
      {
        errors[nameof(tutorCompleteDto.AvatarUploadToken)] = ["Upload token ảnh đại diện là bắt buộc."];
      }

      if (tutorCompleteDto.CvFileId <= 0)
      {
        errors[nameof(tutorCompleteDto.CvFileId)] = ["CV là bắt buộc."];
      }

      if (string.IsNullOrWhiteSpace(tutorCompleteDto.CvUploadToken))
      {
        errors[nameof(tutorCompleteDto.CvUploadToken)] = ["Upload token CV là bắt buộc."];
      }

      if (tutorCompleteDto.HourlyRate <= 0)
      {
        errors[nameof(tutorCompleteDto.HourlyRate)] = ["Mức lương phải lớn hơn 0."];
      }

      if (tutorCompleteDto.SubjectIds == null || tutorCompleteDto.SubjectIds.Count == 0)
      {
        errors[nameof(tutorCompleteDto.SubjectIds)] = ["Phải chọn ít nhất một môn dạy."];
      }

      if (tutorCompleteDto.TeachingLevels == null || tutorCompleteDto.TeachingLevels.Count == 0)
      {
        errors[nameof(tutorCompleteDto.TeachingLevels)] = ["Phải chọn ít nhất một lớp dạy."];
      }

      if (tutorCompleteDto.CareerStatus == null)
      {
        errors[nameof(tutorCompleteDto.CareerStatus)] = ["Trạng thái gia sư là bắt buộc."];
      }

      if (string.IsNullOrWhiteSpace(tutorCompleteDto.Major))
      {
        errors[nameof(tutorCompleteDto.Major)] = ["Ngành học là bắt buộc."];
      }

      if (tutorCompleteDto.AcademicDegree == null)
      {
        errors[nameof(tutorCompleteDto.AcademicDegree)] = ["Trình độ học vấn là bắt buộc."];
      }
    }

    if (errors.Count > 0)
    {
      throw new ValidationException(errors);
    }
  }

  private static void ValidateAddress(RegisterDto dto, Dictionary<string, string[]> errors)
  {
    if (dto.ProvinceId <= 0)
    {
      errors[nameof(dto.ProvinceId)] = ["Tỉnh/Thành phố là bắt buộc."];
    }

    if (string.IsNullOrWhiteSpace(dto.ProvinceName))
    {
      errors[nameof(dto.ProvinceName)] = ["Tên Tỉnh/Thành phố là bắt buộc."];
    }

    if (string.IsNullOrWhiteSpace(dto.WardCode))
    {
      errors[nameof(dto.WardCode)] = ["Phường/Xã là bắt buộc."];
    }

    if (string.IsNullOrWhiteSpace(dto.WardName))
    {
      errors[nameof(dto.WardName)] = ["Tên Phường/Xã là bắt buộc."];
    }
  }

  private static CreateAddressDto BuildAddressDto(RegisterDto dto)
  {
    return new CreateAddressDto
    {
      ProvinceId = dto.ProvinceId,
      ProvinceName = dto.ProvinceName.Trim(),
      WardCode = dto.WardCode.Trim(),
      WardName = dto.WardName.Trim(),
      AddressDetail = string.IsNullOrWhiteSpace(dto.AddressDetail) ? null : dto.AddressDetail.Trim()
    };
  }

  private Student CreateStudentProfile(CreateAddressDto? addressDto, Grade? gradeLevel = null)
  {
    return new Student
    {
      Code = _codeGenerator.GenerateTemporaryCode("STU"),
      GradeLevel = gradeLevel,
      Address = addressDto == null ? null : _mapper.Map<Address>(addressDto)
    };
  }

  private Tutor CreateTutorProfile(RegisterTutorDto dto, FileEntity? cvFile)
  {
    return new Tutor
    {
      Code = _codeGenerator.GenerateTemporaryCode("TUT"),
      Profile = string.IsNullOrWhiteSpace(dto.Profile) ? null : dto.Profile.Trim(),
      HourlyRate = dto.HourlyRate,
      CareerStatus = dto.CareerStatus,
      Major = dto.Major.Trim(),
      AcademicDegree = dto.AcademicDegree,
      Address = _mapper.Map<Address>(BuildAddressDto(dto)),
      CvFileId = cvFile?.Id,
      CvFile = cvFile
    };
  }

  private Tutor CreateTutorProfile(RegisterTutorCompleteDto dto, FileEntity? cvFile)
  {
    return new Tutor
    {
      Code = _codeGenerator.GenerateTemporaryCode("TUT"),
      Profile = string.IsNullOrWhiteSpace(dto.Profile) ? null : dto.Profile.Trim(),
      HourlyRate = dto.HourlyRate,
      CareerStatus = dto.CareerStatus,
      Major = dto.Major.Trim(),
      AcademicDegree = dto.AcademicDegree,
      Address = _mapper.Map<Address>(BuildAddressDto(dto)),
      CvFileId = cvFile?.Id,
      CvFile = cvFile
    };
  }

  private Tutor CreateMinimalTutorProfile()
  {
    return new Tutor
    {
      Code = _codeGenerator.GenerateTemporaryCode("TUT"),
      HourlyRate = 0,
      CareerStatus = null,
      Major = string.Empty,
      AcademicDegree = null
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
    if (user.Student != null)
    {
      user.Student.Code = _codeGenerator.GenerateStudentCode(user.Student.Id);
    }

    if (user.Tutor != null)
    {
      user.Tutor.Code = _codeGenerator.GenerateTutorCode(user.Tutor.Id);
    }
  }

  private async Task<LoginResponseDto> IssueTokenPairAsync(
    User user,
    string? currentRefreshToken = null,
    bool rotateRefreshToken = true)
  {
    if (!string.IsNullOrWhiteSpace(currentRefreshToken) &&
        !string.Equals(user.RefreshToken, currentRefreshToken, StringComparison.Ordinal))
    {
      throw new AppException("Access token hoặc refresh token không hợp lệ", 400);
    }

    var accessToken = GenerateJwtToken(user);

    if (rotateRefreshToken || string.IsNullOrWhiteSpace(user.RefreshToken))
    {
      user.RefreshToken = GenerateRefreshToken();
    }

    user.RefreshTokenExpiryTime = DateTime.UtcNow.Add(RefreshTokenLifetime);

    _userRepository.Update(user);
    await _userRepository.SaveChangesAsync();

    return new LoginResponseDto
    {
      AccessToken = accessToken,
      RefreshToken = user.RefreshToken!,
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

    if (user.Student != null)
    {
      claims.Add(new Claim("studentId", user.Student.Id.ToString()));
    }

    if (user.Tutor != null)
    {
      claims.Add(new Claim("tutorId", user.Tutor.Id.ToString()));
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
    return Base64UrlEncoder.Encode(randomNumber);
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
      throw new SecurityTokenException("Token không hợp lệ");
    }

    return principal;
  }

  private sealed record GoogleUserPayload(string Email, string? Name, string? Picture);

  private sealed class GoogleTokenInfo
  {
    [JsonPropertyName("aud")]
    public string? Aud { get; set; }

    [JsonPropertyName("audience")]
    public string? Audience { get; set; }

    [JsonPropertyName("issued_to")]
    public string? IssuedTo { get; set; }
  }

  private sealed class GoogleUserInfo
  {
    [JsonPropertyName("email")]
    public string? Email { get; set; }

    [JsonPropertyName("email_verified")]
    public bool? EmailVerified { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("picture")]
    public string? Picture { get; set; }
  }
}
