using System.Text.Json;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Domain.Booking.Payments;
using EduMatch.Domain.Booking.Scheduling;
using EduMatch.DTOs;
using EduMatch.DTOs.LearningRequests;
using EduMatch.DTOs.ScheduleProposals;
using EduMatch.Mappers;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
  public class ScheduleProposalService : IScheduleProposalService
  {
    private static readonly JsonSerializerOptions TimeSlotJsonOptions = new()
    {
      PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    private readonly ILearningRequestRepository _learningRequestRepository;
    private readonly IScheduleProposalRepository _scheduleProposalRepository;
    private readonly IDepositPolicyRepository _depositPolicyRepository;
    private readonly INotificationService _notificationService;
    private readonly IBookingScheduleService _bookingScheduleService;
    private readonly IBookingOrchestrator _bookingOrchestrator;
    private readonly IDepositCalculator _depositCalculator;

    public ScheduleProposalService(
      ILearningRequestRepository learningRequestRepository,
      IScheduleProposalRepository scheduleProposalRepository,
      IDepositPolicyRepository depositPolicyRepository,
      INotificationService notificationService,
      IBookingScheduleService bookingScheduleService,
      IBookingOrchestrator bookingOrchestrator,
      IDepositCalculator depositCalculator)
    {
      _learningRequestRepository = learningRequestRepository;
      _scheduleProposalRepository = scheduleProposalRepository;
      _depositPolicyRepository = depositPolicyRepository;
      _notificationService = notificationService;
      _bookingScheduleService = bookingScheduleService;
      _bookingOrchestrator = bookingOrchestrator;
      _depositCalculator = depositCalculator;
    }

    public async Task<ScheduleProposalDto> CreateAsync(long tutorProfileId, CreateScheduleProposalDto dto)
    {
      var request = await _learningRequestRepository.GetByIdWithDetailsAsync(dto.LearningRequestId);
      if (request == null)
      {
        throw new NotFoundException("Khong tim thay yeu cau hoc tap.", "LEARNING_REQUEST_NOT_FOUND");
      }

      if (request.TutorId != tutorProfileId)
      {
        throw new ForbiddenException("Ban khong co quyen de xuat lich hoc cho yeu cau nay.", "SCHEDULE_PROPOSAL_FORBIDDEN");
      }

      EnsureLearningRequestStatus(
        request,
        LearningRequestStatus.Pending,
        "Chi co the de xuat lich hoc khi yeu cau dang o trang thai cho phan hoi.");

      var existingProposal = await _scheduleProposalRepository.GetByLearningRequestIdAsync(request.Id);
      if (existingProposal != null)
      {
        throw new ConflictException("Yeu cau hoc tap nay da co de xuat lich hoc vong 2.", "SCHEDULE_PROPOSAL_ALREADY_EXISTS");
      }

      ValidateDesiredStartDate(dto.DesiredStartDate);

      var validatedTimeSlots = _bookingScheduleService.Validate(
        dto.TimeSlots.Select(slot => new BookingTimeSlotInput
        {
          Day = slot.Day,
          StartTime = slot.StartTime,
          EndTime = slot.EndTime
        }),
        dto.HoursPerSession);

      var activePolicy = await _depositPolicyRepository.GetActivePolicyAsync()
        ?? CreateFallbackDefaultPolicy();

      var totalAmount = CalculateTotalAmount(dto.HourlyRate, dto.HoursPerSession, activePolicy);
      var depositCalculation = _depositCalculator.Calculate(new DepositCalculationRequest
      {
        TotalAmount = totalAmount,
        FixedAmount = totalAmount
      });

      var proposal = new ScheduleProposal
      {
        LearningRequestId = request.Id,
        ProposedBy = tutorProfileId,
        RoundNumber = 2,
        TimeSlots = SerializeTimeSlots(validatedTimeSlots),
        DesiredStartDate = ToUtc(dto.DesiredStartDate),
        HoursPerSession = dto.HoursPerSession,
        HourlyRate = dto.HourlyRate,
        CalculatedDepositAmount = depositCalculation.DepositAmount,
        Status = ScheduleProposalStatus.Pending
      };

      request.Status = LearningRequestStatus.Negotiating;

      await _scheduleProposalRepository.AddAsync(proposal);
      _learningRequestRepository.Update(request);
      await _scheduleProposalRepository.SaveChangesAsync();

      proposal.LearningRequest = request;
      proposal.Tutor = request.Tutor;

      await _notificationService.SendAsync(
        request.StudentId,
        "Gia su de xuat lich hoc moi",
        $"Gia su {request.Tutor?.User?.FullName ?? string.Empty} da gui de xuat lich hoc moi cho mon {request.Subject?.Name ?? string.Empty}.",
        NotificationType.ScheduleProposalCreated,
        "ScheduleProposal",
        proposal.Id,
        $"/schedule-proposals/{proposal.Id}");

      return ScheduleProposalMapper.ToDto(proposal, validatedTimeSlots);
    }

    public async Task<ScheduleProposalDto> GetByIdAsync(long id, long currentUserId, UserRole role, long? tutorProfileId = null)
    {
      var proposal = await _scheduleProposalRepository.GetByIdWithDetailsAsync(id);
      if (proposal == null)
      {
        throw new NotFoundException("Khong tim thay de xuat lich hoc.", "SCHEDULE_PROPOSAL_NOT_FOUND");
      }

      EnsureCanViewProposal(proposal, currentUserId, role, tutorProfileId);

      var timeSlots = _bookingScheduleService.ParseAndValidate(proposal.TimeSlots, proposal.HoursPerSession);
      return ScheduleProposalMapper.ToDto(proposal, timeSlots);
    }

    public async Task<ScheduleProposalDto> GetByLearningRequestIdAsync(long learningRequestId, long currentUserId, UserRole role, long? tutorProfileId = null)
    {
      var proposal = await _scheduleProposalRepository.GetByLearningRequestIdAsync(learningRequestId);
      if (proposal == null)
      {
        throw new NotFoundException("Khong tim thay de xuat lich hoc.", "SCHEDULE_PROPOSAL_NOT_FOUND");
      }

      EnsureCanViewProposal(proposal, currentUserId, role, tutorProfileId);

      var timeSlots = _bookingScheduleService.ParseAndValidate(proposal.TimeSlots, proposal.HoursPerSession);
      return ScheduleProposalMapper.ToDto(proposal, timeSlots);
    }

    public async Task<ApiResponse<ScheduleProposalDto>> AcceptAsync(long id, long currentUserId)
    {
      try
      {
        var proposal = await GetProposalForStudentActionAsync(id, currentUserId);
        var requestedSlots = _bookingScheduleService.ParseAndValidate(proposal.TimeSlots, proposal.HoursPerSession);

        await _bookingOrchestrator.SoftBookAsync(
          proposal.LearningRequest.Id,
          proposal.ProposedBy,
          requestedSlots,
          proposal.Id);
        proposal = await ReloadAcceptedProposalAsync(id);
        requestedSlots = _bookingScheduleService.ParseAndValidate(proposal.TimeSlots, proposal.HoursPerSession);

        await _notificationService.SendAsync(
          proposal.Tutor.UserId,
          "Hoc vien da chap nhan de xuat lich hoc",
          $"Hoc vien {proposal.LearningRequest.Student?.FullName ?? string.Empty} da chap nhan de xuat lich hoc cho mon {proposal.LearningRequest.Subject?.Name ?? string.Empty}.",
          NotificationType.ScheduleProposalAccepted,
          "ScheduleProposal",
          proposal.Id,
          $"/schedule-proposals/{proposal.Id}");

        return ApiResponse<ScheduleProposalDto>.SuccessResult(
          ScheduleProposalMapper.ToDto(proposal, requestedSlots),
          "Chap nhan de xuat lich hoc thanh cong.",
          200);
      }
      catch (ConflictException ex)
      {
        return ApiResponse<ScheduleProposalDto>.Fail(ex.Message, ex.StatusCode);
      }
    }

    public async Task<ApiResponse<ScheduleProposalDto>> RejectAsync(long id, long currentUserId)
    {
      try
      {
        var proposal = await GetProposalForStudentActionAsync(id, currentUserId);
        var requestedSlots = _bookingScheduleService.ParseAndValidate(proposal.TimeSlots, proposal.HoursPerSession);

        proposal.Status = ScheduleProposalStatus.Rejected;
        proposal.LearningRequest.Status = LearningRequestStatus.StudentRejected;

        _scheduleProposalRepository.Update(proposal);
        _learningRequestRepository.Update(proposal.LearningRequest);
        await _scheduleProposalRepository.SaveChangesAsync();

        await _notificationService.SendAsync(
          proposal.Tutor.UserId,
          "Hoc vien da tu choi de xuat lich hoc",
          $"Hoc vien {proposal.LearningRequest.Student?.FullName ?? string.Empty} da tu choi de xuat lich hoc cho mon {proposal.LearningRequest.Subject?.Name ?? string.Empty}.",
          NotificationType.ScheduleProposalRejected,
          "ScheduleProposal",
          proposal.Id,
          $"/schedule-proposals/{proposal.Id}");

        return ApiResponse<ScheduleProposalDto>.SuccessResult(
          ScheduleProposalMapper.ToDto(proposal, requestedSlots),
          "Tu choi de xuat lich hoc thanh cong.",
          200);
      }
      catch (ConflictException ex)
      {
        return ApiResponse<ScheduleProposalDto>.Fail(ex.Message, ex.StatusCode);
      }
    }

    private async Task<ScheduleProposal> GetProposalForStudentActionAsync(long id, long currentUserId)
    {
      var proposal = await _scheduleProposalRepository.GetByIdWithDetailsAsync(id);
      if (proposal == null)
      {
        throw new NotFoundException("Khong tim thay de xuat lich hoc.", "SCHEDULE_PROPOSAL_NOT_FOUND");
      }

      if (proposal.LearningRequest.StudentId != currentUserId)
      {
        throw new ForbiddenException("Ban khong co quyen phan hoi de xuat lich hoc nay.", "SCHEDULE_PROPOSAL_FORBIDDEN");
      }

      if (proposal.Status != ScheduleProposalStatus.Pending)
      {
        throw new ConflictException("De xuat lich hoc khong con o trang thai cho phan hoi.", "SCHEDULE_PROPOSAL_INVALID_STATUS");
      }

      EnsureLearningRequestStatus(
        proposal.LearningRequest,
        LearningRequestStatus.Negotiating,
        "Yeu cau hoc tap khong con o trang thai thuong luong.");

      return proposal;
    }

    private static void EnsureCanViewProposal(
      ScheduleProposal proposal,
      long currentUserId,
      UserRole role,
      long? tutorProfileId)
    {
      if (role == UserRole.Admin)
      {
        return;
      }

      if (role == UserRole.Student && proposal.LearningRequest.StudentId == currentUserId)
      {
        return;
      }

      if (role == UserRole.Tutor && tutorProfileId.HasValue && proposal.LearningRequest.TutorId == tutorProfileId.Value)
      {
        return;
      }

      throw new ForbiddenException("Ban khong co quyen xem de xuat lich hoc nay.", "SCHEDULE_PROPOSAL_FORBIDDEN");
    }

    private async Task<ScheduleProposal> GetAcceptedProposalAsync(long id)
    {
      var proposal = await _scheduleProposalRepository.GetByIdWithDetailsAsync(id);
      if (proposal == null)
      {
        throw new NotFoundException("Khong tim thay de xuat lich hoc.", "SCHEDULE_PROPOSAL_NOT_FOUND");
      }

      return proposal;
    }

    private async Task<ScheduleProposal> ReloadAcceptedProposalAsync(long id)
    {
      var proposal = await _scheduleProposalRepository.GetByIdWithDetailsAsync(id);
      if (proposal == null)
      {
        throw new NotFoundException("Khong tim thay de xuat lich hoc.", "SCHEDULE_PROPOSAL_NOT_FOUND");
      }

      return proposal;
    }

    private static decimal CalculateTotalAmount(decimal hourlyRate, decimal hoursPerSession, DepositPolicy policy)
    {
      var grossAmount = hourlyRate * hoursPerSession * policy.DepositSessionCount;
      return decimal.Round(
        grossAmount * (1 - policy.DiscountPercent),
        2,
        MidpointRounding.AwayFromZero);
    }

    private static DepositPolicy CreateFallbackDefaultPolicy()
    {
      return new DepositPolicy
      {
        DepositSessionCount = DepositPolicyDefaults.SessionCount,
        DiscountPercent = DepositPolicyDefaults.DiscountPercent
      };
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
            [nameof(CreateScheduleProposalDto.DesiredStartDate)] = ["DesiredStartDate khong duoc de trong."]
          },
          "INVALID_DESIRED_START_DATE");
      }
    }

    private static void EnsureLearningRequestStatus(
      LearningRequest request,
      LearningRequestStatus expectedStatus,
      string message)
    {
      if (request.Status != expectedStatus)
      {
        throw new ConflictException(message, "LEARNING_REQUEST_INVALID_STATUS");
      }
    }

    private static DateTime ToUtc(DateTime dateTime)
    {
      return dateTime.Kind == DateTimeKind.Utc ? dateTime : dateTime.ToUniversalTime();
    }
  }
}
