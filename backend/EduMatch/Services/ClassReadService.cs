using EduMatch.Common.Exception;
using EduMatch.Domain.Booking.Scheduling;
using EduMatch.DTOs;
using EduMatch.DTOs.Classes;
using EduMatch.Mappers;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services;

public class ClassReadService : IClassReadService
{
  private static readonly decimal[] CandidateHoursPerSession =
  [
    0.5m,
    1m,
    1.5m,
    2m,
    2.5m,
    3m
  ];

  private readonly IClassRepository _classRepository;
  private readonly IPaymentRepository _paymentRepository;
  private readonly IBookingScheduleService _bookingScheduleService;

  public ClassReadService(
    IClassRepository classRepository,
    IPaymentRepository paymentRepository,
    IBookingScheduleService bookingScheduleService)
  {
    _classRepository = classRepository;
    _paymentRepository = paymentRepository;
    _bookingScheduleService = bookingScheduleService;
  }

  public async Task<ApiResponse<PagedResult<ClassDto>>> GetStudentClassesAsync(long currentUserId, ClassQueryParameters parameters)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
    {
      var pagedClasses = await _classRepository.GetPagedWithDetailsAsync(parameters, studentId: currentUserId);
      return ApiResponse<PagedResult<ClassDto>>.SuccessResult(await MapPagedAsync(pagedClasses));
    });
  }

  public async Task<ApiResponse<PagedResult<ClassDto>>> GetTutorClassesAsync(long tutorProfileId, ClassQueryParameters parameters)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
    {
      var pagedClasses = await _classRepository.GetPagedWithDetailsAsync(parameters, tutorId: tutorProfileId);
      return ApiResponse<PagedResult<ClassDto>>.SuccessResult(await MapPagedAsync(pagedClasses));
    });
  }

  public async Task<ApiResponse<ClassDto>> GetByIdAsync(long id, long currentUserId, bool isAdmin = false)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
    {
      var classEntity = await _classRepository.GetByIdWithDetailsAsync(id);
      if (classEntity == null)
      {
        throw new NotFoundException("Không tìm thấy lớp học.", "CLASS_NOT_FOUND");
      }

      if (!isAdmin
        && classEntity.StudentId != currentUserId
        && classEntity.Tutor?.UserId != currentUserId)
      {
        throw new ForbiddenException("Bạn không có quyền xem lớp học này.", "CLASS_VIEW_FORBIDDEN");
      }

      var payment = await _paymentRepository.GetSuccessfulPaymentByClassIdAsync(classEntity.Id);
      return ApiResponse<ClassDto>.SuccessResult(
        ClassMapper.ToDto(classEntity, ParseClassTimeSlots(classEntity.TimeSlotsJson), payment));
    });
  }

  public async Task<ApiResponse<PagedResult<ClassDto>>> GetAdminClassesAsync(ClassQueryParameters parameters)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
    {
      var pagedClasses = await _classRepository.GetPagedWithDetailsAsync(parameters);
      return ApiResponse<PagedResult<ClassDto>>.SuccessResult(await MapPagedAsync(pagedClasses));
    });
  }

  private async Task<PagedResult<ClassDto>> MapPagedAsync(PagedResult<Class> pagedClasses)
  {
    var classIds = pagedClasses.Items
      .Select(item => item.Id)
      .ToList();

    var paymentsByClassId = await _paymentRepository.GetSuccessfulPaymentsByClassIdsAsync(classIds);

    return new PagedResult<ClassDto>
    {
      Items = pagedClasses.Items
        .Select(classEntity => ClassMapper.ToDto(
          classEntity,
          ParseClassTimeSlots(classEntity.TimeSlotsJson),
          paymentsByClassId.GetValueOrDefault(classEntity.Id)))
        .ToList(),
      TotalCount = pagedClasses.TotalCount,
      Page = pagedClasses.Page,
      PageSize = pagedClasses.PageSize,
      TotalPages = pagedClasses.TotalPages
    };
  }

  private IReadOnlyList<BookingTimeSlot> ParseClassTimeSlots(string? timeSlotsJson)
  {
    if (string.IsNullOrWhiteSpace(timeSlotsJson))
    {
      return [];
    }

    ValidationException? lastValidationException = null;

    foreach (var hoursPerSession in CandidateHoursPerSession)
    {
      try
      {
        return _bookingScheduleService.ParseAndValidate(timeSlotsJson, hoursPerSession);
      }
      catch (ValidationException ex)
      {
        lastValidationException = ex;
      }
    }

    throw lastValidationException ?? new ValidationException("TimeSlotsJson khÃ´ng há»£p lá»‡.", "INVALID_TIME_SLOTS");
  }
}
