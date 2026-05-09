using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.DTOs.TutorRequests;
using EduMatch.Enums;
using EduMatch.Exception;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Services
{
  public class TutorRequestService : ITutorRequestService
  {
    private readonly ITutorRequestRepository _tutorRequestRepository;
    private readonly AppDbContext _dbContext;
    private readonly INotificationService _notificationService;
    private readonly ILogger<TutorRequestService> _logger;
    private readonly ICodeGeneratorService _codeGenerator;

    public TutorRequestService(
      ITutorRequestRepository tutorRequestRepository,
      AppDbContext dbContext,
      INotificationService notificationService,
      ILogger<TutorRequestService> logger,
      ICodeGeneratorService codeGenerator)
    {
      _tutorRequestRepository = tutorRequestRepository;
      _dbContext = dbContext;
      _notificationService = notificationService;
      _logger = logger;
      _codeGenerator = codeGenerator;
    }

    public async Task<ApiResponse<TutorRequestResponseDto>> CreateAsync(long studentId, CreateTutorRequestDto dto)
    {
      var utcNow = DateTime.UtcNow;
      ValidateExpiry(dto.ExpiresAt, utcNow);

      var student = await _dbContext.Users.FirstOrDefaultAsync(x => x.Id == studentId);
      if (student == null)
      {
        throw new AppException("Không tìm thấy học sinh", 404);
      }

      var subject = await _dbContext.Subjects.FirstOrDefaultAsync(x => x.Id == dto.SubjectId);
      if (subject == null)
      {
        throw new AppException("Không tìm thấy môn học", 404);
      }

      Address? address = null;
      if (HasAnyAddressField(dto))
      {
        address = BuildAddress(dto);
      }

      var request = new TutorRequest
      {
        StudentId = studentId,
        SubjectId = dto.SubjectId,
        Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim(),
        Status = TutorRequestStatus.Open,
        PricePerSession = dto.PricePerSession,
        ExpiresAt = ToUtc(dto.ExpiresAt),
        PreferredSchedule = dto.PreferredSchedule,
        SessionsPerWeek = dto.SessionsPerWeek,
        MinutesPerSession = dto.MinutesPerSession,
        GradeLevel = dto.GradeLevel,
        EducationLevel = dto.EducationLevel,
        Address = address
      };

      await _tutorRequestRepository.CreateAsync(request);
      
      request.Code = _codeGenerator.GenerateClassRequestCode(request.Id);
      await _tutorRequestRepository.UpdateAsync(request);

      request.Student = student;
      request.Subject = subject;

      var adminIds = await _dbContext.Users
        .Where(x => x.Role == UserRole.Admin)
        .Select(x => x.Id)
        .ToListAsync();

      await _notificationService.SendToMultipleAsync(
        adminIds,
        "Bài đăng mới",
        $"Có bài đăng tìm gia sư mới cho môn {subject.Name}",
        NotificationType.TutorRequestCreated,
        "TutorRequest",
        request.Id,
        $"/admin/tutor-requests/{request.Id}");

      _logger.LogInformation("Student {StudentId} created TutorRequest {RequestId}, expires {ExpiresAt}", studentId, request.Id, request.ExpiresAt);

      return ApiResponse<TutorRequestResponseDto>.SuccessResult(MapTutorRequest(request), "Tạo bài đăng tìm gia sư thành công");
    }

    public async Task<ApiResponse<PagedResult<TutorRequestResponseDto>>> GetAllAsync(TutorRequestFilterDto filter)
    {
      var pagedRequests = await _tutorRequestRepository.GetAllAsync(filter);
      var result = new PagedResult<TutorRequestResponseDto>
      {
        Items = pagedRequests.Items.Select(MapTutorRequest).ToList(),
        TotalCount = pagedRequests.TotalCount,
        Page = pagedRequests.Page,
        PageSize = pagedRequests.PageSize,
        TotalPages = pagedRequests.TotalPages
      };

      return ApiResponse<PagedResult<TutorRequestResponseDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<PagedResult<TutorRequestResponseDto>>> GetMyRequestsAsync(long studentId, int page, int pageSize)
    {
      var pagedRequests = await _tutorRequestRepository.GetByStudentIdAsync(studentId, page, pageSize);
      var result = new PagedResult<TutorRequestResponseDto>
      {
        Items = pagedRequests.Items.Select(MapTutorRequest).ToList(),
        TotalCount = pagedRequests.TotalCount,
        Page = pagedRequests.Page,
        PageSize = pagedRequests.PageSize,
        TotalPages = pagedRequests.TotalPages
      };

      return ApiResponse<PagedResult<TutorRequestResponseDto>>.SuccessResult(result);
    }

    public async Task<ApiResponse<TutorRequestResponseDto>> GetByIdAsync(long id)
    {
      var request = await _tutorRequestRepository.GetByIdAsync(id);
      if (request == null)
      {
        throw new AppException("Không tìm thấy bài đăng", 404);
      }

      return ApiResponse<TutorRequestResponseDto>.SuccessResult(MapTutorRequest(request));
    }

    public async Task<ApiResponse<bool>> CloseAsync(long id, long studentId)
    {
      var request = await _tutorRequestRepository.GetByIdAsync(id);
      if (request == null)
      {
        throw new AppException("Không tìm thấy bài đăng", 404);
      }

      if (request.StudentId != studentId)
      {
        throw new AppException("Bạn không có quyền đóng bài đăng này", 403);
      }

      if (request.Status == TutorRequestStatus.Assigned)
      {
        throw new AppException("Bài đăng đã được ghép lớp, không thể đóng", 400);
      }

      request.Status = TutorRequestStatus.Closed;
      await _tutorRequestRepository.UpdateAsync(request);

      return ApiResponse<bool>.SuccessResult(true, "Đóng bài đăng thành công");
    }

    public async Task<ApiResponse<TutorRequestResponseDto>> UpdateAsync(long id, long studentId, UpdateTutorRequestDto dto)
    {
      var utcNow = DateTime.UtcNow;
      ValidateExpiry(dto.ExpiresAt, utcNow);

      var request = await _tutorRequestRepository.GetByIdAsync(id);
      if (request == null)
      {
        throw new AppException("Không tìm thấy bài đăng", 404);
      }

      if (request.StudentId != studentId)
      {
        throw new AppException("Bạn không có quyền cập nhật bài đăng này", 403);
      }

      if (request.Applications != null && request.Applications.Any(x => !x.IsDeleted))
      {
        throw new AppException("Không thể cập nhật bài đăng đã có gia sư ứng tuyển", 400);
      }

      var subject = await _dbContext.Subjects.FirstOrDefaultAsync(x => x.Id == dto.SubjectId);
      if (subject == null)
      {
        throw new AppException("Không tìm thấy môn học", 404);
      }

      request.SubjectId = dto.SubjectId;
      request.Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim();
      request.PricePerSession = dto.PricePerSession;
      request.ExpiresAt = ToUtc(dto.ExpiresAt);
      request.PreferredSchedule = dto.PreferredSchedule;
      request.SessionsPerWeek = dto.SessionsPerWeek;
      request.MinutesPerSession = dto.MinutesPerSession;
      request.GradeLevel = dto.GradeLevel;
      request.EducationLevel = dto.EducationLevel;

      if (HasAnyAddressFieldUpdate(dto))
      {
        if (request.Address == null)
        {
            request.Address = BuildAddressUpdate(dto);
        }
        else
        {
            request.Address.ProvinceId = dto.ProvinceId!.Value;
            request.Address.ProvinceName = dto.ProvinceName!.Trim();
            request.Address.WardCode = dto.WardCode!.Trim();
            request.Address.WardName = dto.WardName!.Trim();
            request.Address.AddressDetail = string.IsNullOrWhiteSpace(dto.AddressDetail) ? null : dto.AddressDetail.Trim();
            request.Address.FullAddress = string.Join(", ", new[] { request.Address.AddressDetail, request.Address.WardName, request.Address.ProvinceName }.Where(x => !string.IsNullOrWhiteSpace(x)));
        }
      }
      else
      {
          if (request.Address != null)
          {
              _dbContext.Addresses.Remove(request.Address);
              request.Address = null;
              request.AddressId = null;
          }
      }

      await _tutorRequestRepository.UpdateAsync(request);

      return ApiResponse<TutorRequestResponseDto>.SuccessResult(MapTutorRequest(request), "Cập nhật bài đăng thành công");
    }

    private static TutorRequestResponseDto MapTutorRequest(TutorRequest request)
    {
      var utcNow = DateTime.UtcNow;
      return new TutorRequestResponseDto
      {
        Id = request.Id,
        Code = request.Code,
        StudentId = request.StudentId,
        StudentName = request.Student?.FullName ?? string.Empty,
        StudentAvatar = request.Student?.AvatarFile?.FilePath ?? string.Empty,
        SubjectId = request.SubjectId,
        SubjectName = request.Subject?.Name ?? string.Empty,
        Note = request.Note,
        Status = request.Status.ToString(),
        IsExpired = request.ExpiresAt.HasValue && request.ExpiresAt.Value < utcNow,
        PricePerSession = request.PricePerSession,
        FullAddress = request.Address?.FullAddress,
        ExpiresAt = request.ExpiresAt,
        PreferredSchedule = request.PreferredSchedule,
        SessionsPerWeek = request.SessionsPerWeek,
        MinutesPerSession = request.MinutesPerSession,
        SessionsPerMonth = request.SessionsPerWeek * 4,
        GradeLevel = request.GradeLevel?.ToString(),
        EducationLevel = request.EducationLevel?.ToString(),
        ApplicationCount = request.Applications?.Count(x => !x.IsDeleted) ?? 0,
        CreatedAt = request.CreatedAt
      };
    }

    private static bool HasAnyAddressField(CreateTutorRequestDto dto)
    {
      return dto.ProvinceId.HasValue
        || !string.IsNullOrWhiteSpace(dto.ProvinceName)
        || !string.IsNullOrWhiteSpace(dto.WardCode)
        || !string.IsNullOrWhiteSpace(dto.WardName)
        || !string.IsNullOrWhiteSpace(dto.AddressDetail);
    }

    private static Address BuildAddress(CreateTutorRequestDto dto)
    {
      if (!dto.ProvinceId.HasValue
        || string.IsNullOrWhiteSpace(dto.ProvinceName)
        || string.IsNullOrWhiteSpace(dto.WardCode)
        || string.IsNullOrWhiteSpace(dto.WardName))
      {
        throw new AppException("Thông tin địa chỉ không hợp lệ", 400);
      }

      var provinceName = dto.ProvinceName.Trim();
      var wardName = dto.WardName.Trim();
      var addressDetail = string.IsNullOrWhiteSpace(dto.AddressDetail) ? null : dto.AddressDetail.Trim();

      return new Address
      {
        ProvinceId = dto.ProvinceId.Value,
        ProvinceName = provinceName,
        WardCode = dto.WardCode.Trim(),
        WardName = wardName,
        AddressDetail = addressDetail,
        FullAddress = string.Join(", ", new[] { addressDetail, wardName, provinceName }.Where(x => !string.IsNullOrWhiteSpace(x)))
      };
    }

    private static void ValidateExpiry(DateTime expiresAt, DateTime utcNow)
    {
      var utcExpiresAt = ToUtc(expiresAt);
      if (utcExpiresAt <= utcNow.AddDays(1) || utcExpiresAt >= utcNow.AddDays(90))
      {
        throw new AppException("ExpiresAt phải lớn hơn hiện tại 1 ngày và nhỏ hơn 90 ngày", 400);
      }
    }

    private static DateTime ToUtc(DateTime dateTime)
    {
      return dateTime.Kind == DateTimeKind.Utc ? dateTime : dateTime.ToUniversalTime();
    }

    private static bool HasAnyAddressFieldUpdate(UpdateTutorRequestDto dto)
    {
      return dto.ProvinceId.HasValue
        || !string.IsNullOrWhiteSpace(dto.ProvinceName)
        || !string.IsNullOrWhiteSpace(dto.WardCode)
        || !string.IsNullOrWhiteSpace(dto.WardName)
        || !string.IsNullOrWhiteSpace(dto.AddressDetail);
    }

    private static Address BuildAddressUpdate(UpdateTutorRequestDto dto)
    {
      if (!dto.ProvinceId.HasValue
        || string.IsNullOrWhiteSpace(dto.ProvinceName)
        || string.IsNullOrWhiteSpace(dto.WardCode)
        || string.IsNullOrWhiteSpace(dto.WardName))
      {
        throw new AppException("Thông tin địa chỉ không hợp lệ", 400);
      }

      var provinceName = dto.ProvinceName.Trim();
      var wardName = dto.WardName.Trim();
      var addressDetail = string.IsNullOrWhiteSpace(dto.AddressDetail) ? null : dto.AddressDetail.Trim();

      return new Address
      {
        ProvinceId = dto.ProvinceId.Value,
        ProvinceName = provinceName,
        WardCode = dto.WardCode.Trim(),
        WardName = wardName,
        AddressDetail = addressDetail,
        FullAddress = string.Join(", ", new[] { addressDetail, wardName, provinceName }.Where(x => !string.IsNullOrWhiteSpace(x)))
      };
    }


  }
}
