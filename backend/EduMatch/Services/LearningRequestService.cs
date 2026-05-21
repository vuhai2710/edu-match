using System.Text.Json;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Domain.Booking.Payments;
using EduMatch.Domain.Booking.Scheduling;
using EduMatch.DTOs;
using EduMatch.DTOs.LearningRequests;
using EduMatch.Mappers;
using EduMatch.Models;
using EduMatch.Repositories;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
  public class LearningRequestService : ILearningRequestService
  {
    private static readonly JsonSerializerOptions TimeSlotJsonOptions = new()
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly ILearningRequestRepository _learningRequestRepository;
    private readonly IStudentRepository _studentRepository;
    private readonly ITutorRepository _tutorRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly IDepositPolicyRepository _depositPolicyRepository;
    private readonly INotificationService _notificationService;
    private readonly IBookingScheduleService _bookingScheduleService;
    private readonly IDepositCalculator _depositCalculator;

    public LearningRequestService(
      ILearningRequestRepository learningRequestRepository,
      IStudentRepository studentRepository,
      ITutorRepository tutorRepository,
      ISubjectRepository subjectRepository,
      IDepositPolicyRepository depositPolicyRepository,
      INotificationService notificationService,
      IBookingScheduleService bookingScheduleService,
      IDepositCalculator depositCalculator)
    {
      _learningRequestRepository = learningRequestRepository;
      _studentRepository = studentRepository;
      _tutorRepository = tutorRepository;
      _subjectRepository = subjectRepository;
      _depositPolicyRepository = depositPolicyRepository;
      _notificationService = notificationService;
      _bookingScheduleService = bookingScheduleService;
      _depositCalculator = depositCalculator;
    }

    public async Task<LearningRequestDto> CreateAsync(long currentUserId, CreateLearningRequestDto dto)
    {
      ValidateDesiredStartDate(dto.DesiredStartDate);

      var student = await _studentRepository.GetStudentDetailByUserIdAsync(currentUserId);
      if (student == null)
      {
        throw new NotFoundException("Không tìm thấy thông tin học viên.", "STUDENT_NOT_FOUND");
      }

      var tutor = await _tutorRepository.GetTutorProfileDetailAsync(dto.TutorProfileId);
      if (tutor == null)
      {
        throw new NotFoundException("Không tìm thấy thông tin gia sư.", "TUTOR_NOT_FOUND");
      }

      var subject = await _subjectRepository.GetByIdAsync(dto.SubjectId);
      if (subject == null)
      {
        throw new NotFoundException("Không tìm thấy môn học.", "SUBJECT_NOT_FOUND");
      }

      var validatedTimeSlots = _bookingScheduleService.Validate(
        dto.TimeSlots.Select(slot => new BookingTimeSlotInput
        {
          Day = slot.Day,
          StartTime = slot.StartTime,
          EndTime = slot.EndTime
        }),
        dto.HoursPerSession);

      var activePolicy = await _depositPolicyRepository.GetActivePolicyAsync();
      if (activePolicy == null)
      {
        throw new NotFoundException("Không tìm thấy chính sách đặt cọc đang hiệu lực.", "DEPOSIT_POLICY_NOT_FOUND");
      }

      var totalAmount = CalculateTotalAmount(dto.BudgetPerHour, dto.HoursPerSession, activePolicy);
      var depositCalculation = _depositCalculator.Calculate(new DepositCalculationRequest
      {
        TotalAmount = totalAmount,
        FixedAmount = totalAmount
      });

      var entity = new LearningRequest
      {
        StudentId = currentUserId,
        TutorProfileId = tutor.Id,
        SubjectId = subject.Id,
        Note = string.IsNullOrWhiteSpace(dto.Note) ? null : dto.Note.Trim(),
        TimeSlots = SerializeTimeSlots(validatedTimeSlots),
        DesiredStartDate = ToUtc(dto.DesiredStartDate),
        HoursPerSession = dto.HoursPerSession,
        BudgetPerHour = dto.BudgetPerHour,
        CalculatedDepositAmount = depositCalculation.DepositAmount,
        ScheduleExpiresAt = DateTime.UtcNow.AddHours(24),
        Status = LearningRequestStatus.Pending
      };

      await _learningRequestRepository.AddAsync(entity);
      await _learningRequestRepository.SaveChangesAsync();

      entity.Student = student.User;
      entity.TutorProfile = tutor;
      entity.Subject = subject;

      await _notificationService.SendAsync(
        tutor.UserId,
        "Yêu cầu học tập mới",
        $"Học viên {student.User.FullName} đã gửi yêu cầu học {subject.Name}.",
        NotificationType.LearningRequestCreated,
        "LearningRequest",
        entity.Id,
        $"/learning-requests/{entity.Id}");

      return LearningRequestMapper.ToDto(entity, validatedTimeSlots);
    }

    public async Task<PagedResult<LearningRequestDto>> GetMyRequestsAsync(long currentUserId, LearningRequestQueryParameters parameters)
    {
      var student = await _studentRepository.GetStudentDetailByUserIdAsync(currentUserId);
      if (student == null)
      {
        throw new NotFoundException("Không tìm thấy thông tin học viên.", "STUDENT_NOT_FOUND");
      }

      var pagedRequests = await _learningRequestRepository.GetByStudentIdAsync(currentUserId, parameters);

      return new PagedResult<LearningRequestDto>
      {
        Items = pagedRequests.Items
          .Select(request => LearningRequestMapper.ToDto(
            request,
            _bookingScheduleService.ParseAndValidate(request.TimeSlots, request.HoursPerSession)))
          .ToList(),
        TotalCount = pagedRequests.TotalCount,
        Page = pagedRequests.Page,
        PageSize = pagedRequests.PageSize,
        TotalPages = pagedRequests.TotalPages
      };
    }

    public async Task<LearningRequestDto> GetByIdAsync(long id, long currentUserId)
    {
      var request = await _learningRequestRepository.GetByIdWithDetailsAsync(id);
      if (request == null)
      {
        throw new NotFoundException("Không tìm thấy yêu cầu học tập.", "LEARNING_REQUEST_NOT_FOUND");
      }

      if (request.StudentId != currentUserId)
      {
        throw new ForbiddenException("Bạn không có quyền xem yêu cầu học tập này.", "LEARNING_REQUEST_FORBIDDEN");
      }

      var timeSlots = _bookingScheduleService.ParseAndValidate(request.TimeSlots, request.HoursPerSession);
      return LearningRequestMapper.ToDto(request, timeSlots);
    }

    private static decimal CalculateTotalAmount(decimal budgetPerHour, decimal hoursPerSession, DepositPolicy policy)
    {
      var grossAmount = budgetPerHour * hoursPerSession * policy.DepositSessionCount;
      return decimal.Round(
        grossAmount * (1 - policy.DiscountPercent),
        2,
        MidpointRounding.AwayFromZero);
    }

    private static string SerializeTimeSlots(IEnumerable<BookingTimeSlot> timeSlots)
    {
      var payload = timeSlots.Select(slot => new TimeSlotDto
      {
        Day = slot.Day.ToString(),
        StartTime = slot.StartTime.ToString("HH:mm"),
        EndTime = slot.EndTime.ToString("HH:mm")
      });

      return JsonSerializer.Serialize(payload, TimeSlotJsonOptions);
    }

    private static void ValidateDesiredStartDate(DateTime desiredStartDate)
    {
      if (desiredStartDate == default)
      {
        throw new ValidationException(
          new Dictionary<string, string[]>
          {
            [nameof(CreateLearningRequestDto.DesiredStartDate)] = ["DesiredStartDate khong duoc de trong."]
          },
          "INVALID_DESIRED_START_DATE");
      }
    }

    private static DateTime ToUtc(DateTime dateTime)
    {
      return dateTime.Kind == DateTimeKind.Utc ? dateTime : dateTime.ToUniversalTime();
    }
  }
}
