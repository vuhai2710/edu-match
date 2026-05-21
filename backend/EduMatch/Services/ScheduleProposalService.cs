using System.Text.Json;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Domain.Booking.Payments;
using EduMatch.Domain.Booking.Scheduling;
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
        throw new NotFoundException("Không tìm thấy yêu cầu học tập.", "LEARNING_REQUEST_NOT_FOUND");
      }

      if (request.TutorProfileId != tutorProfileId)
      {
        throw new ForbiddenException("Bạn không có quyền đề xuất lịch học cho yêu cầu này.", "SCHEDULE_PROPOSAL_FORBIDDEN");
      }

      EnsureLearningRequestStatus(
        request,
        LearningRequestStatus.Pending,
        "Chỉ có thể đề xuất lịch học khi yêu cầu đang ở trạng thái chờ phản hồi.");

      var existingProposal = await _scheduleProposalRepository.GetByLearningRequestIdAsync(request.Id);
      if (existingProposal != null)
      {
        throw new ConflictException("Yêu cầu học tập này đã có đề xuất lịch học vòng 2.", "SCHEDULE_PROPOSAL_ALREADY_EXISTS");
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

      var activePolicy = await _depositPolicyRepository.GetActivePolicyAsync();
      if (activePolicy == null)
      {
        throw new NotFoundException("Không tìm thấy chính sách đặt cọc đang hiệu lực.", "DEPOSIT_POLICY_NOT_FOUND");
      }

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
      proposal.Tutor = request.TutorProfile;

      await _notificationService.SendAsync(
        request.StudentId,
        "Gia sư đề xuất lịch học mới",
        $"Gia sư {request.TutorProfile?.User?.FullName ?? string.Empty} đã gửi đề xuất lịch học mới cho môn {request.Subject?.Name ?? string.Empty}.",
        NotificationType.ScheduleProposalCreated,
        "ScheduleProposal",
        proposal.Id,
        $"/schedule-proposals/{proposal.Id}");

      return ScheduleProposalMapper.ToDto(proposal, validatedTimeSlots);
    }

    public async Task<ScheduleProposalDto> AcceptAsync(long id, long currentUserId)
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
        "Học viên đã chấp nhận đề xuất lịch học",
        $"Học viên {proposal.LearningRequest.Student?.FullName ?? string.Empty} đã chấp nhận đề xuất lịch học cho môn {proposal.LearningRequest.Subject?.Name ?? string.Empty}.",
        NotificationType.ScheduleProposalAccepted,
        "ScheduleProposal",
        proposal.Id,
        $"/schedule-proposals/{proposal.Id}");

      return ScheduleProposalMapper.ToDto(proposal, requestedSlots);
    }

    public async Task<ScheduleProposalDto> RejectAsync(long id, long currentUserId)
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
        "Học viên đã từ chối đề xuất lịch học",
        $"Học viên {proposal.LearningRequest.Student?.FullName ?? string.Empty} đã từ chối đề xuất lịch học cho môn {proposal.LearningRequest.Subject?.Name ?? string.Empty}.",
        NotificationType.ScheduleProposalRejected,
        "ScheduleProposal",
        proposal.Id,
        $"/schedule-proposals/{proposal.Id}");

      return ScheduleProposalMapper.ToDto(proposal, requestedSlots);
    }

    private async Task<ScheduleProposal> GetProposalForStudentActionAsync(long id, long currentUserId)
    {
      var proposal = await _scheduleProposalRepository.GetByIdWithDetailsAsync(id);
      if (proposal == null)
      {
        throw new NotFoundException("Không tìm thấy đề xuất lịch học.", "SCHEDULE_PROPOSAL_NOT_FOUND");
      }

      if (proposal.LearningRequest.StudentId != currentUserId)
      {
        throw new ForbiddenException("Bạn không có quyền phản hồi đề xuất lịch học này.", "SCHEDULE_PROPOSAL_FORBIDDEN");
      }

      if (proposal.Status != ScheduleProposalStatus.Pending)
      {
        throw new ConflictException("Đề xuất lịch học không còn ở trạng thái chờ phản hồi.", "SCHEDULE_PROPOSAL_INVALID_STATUS");
      }

      EnsureLearningRequestStatus(
        proposal.LearningRequest,
        LearningRequestStatus.Negotiating,
        "Yêu cầu học tập không còn ở trạng thái thương lượng.");

      return proposal;
    }

    private async Task<ScheduleProposal> GetAcceptedProposalAsync(long id)
    {
      var proposal = await _scheduleProposalRepository.GetByIdWithDetailsAsync(id);
      if (proposal == null)
      {
        throw new NotFoundException("Không tìm thấy đề xuất lịch học.", "SCHEDULE_PROPOSAL_NOT_FOUND");
      }

      return proposal;
    }

    private async Task<ScheduleProposal> ReloadAcceptedProposalAsync(long id)
    {
      var proposal = await _scheduleProposalRepository.GetByIdWithDetailsAsync(id);
      if (proposal == null)
      {
        throw new NotFoundException("Không tìm thấy đề xuất lịch học.", "SCHEDULE_PROPOSAL_NOT_FOUND");
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
