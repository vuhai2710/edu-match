using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Domain.Booking.Payments;
using EduMatch.Domain.Booking.Scheduling;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services;
using EduMatch.Services.Interfaces;
using Moq;

namespace EduMatch.Tests.Services;

public class SoftBookConflictResponseTests
{
  [Fact]
  public async Task TutorAcceptAsync_ReturnsConflictResponse_WhenSoftBookConflicts()
  {
    var request = CreateLearningRequest(LearningRequestStatus.Pending);
    var requestedSlots = CreateSlots();

    var learningRequestRepository = new Mock<ILearningRequestRepository>();
    learningRequestRepository
      .Setup(repo => repo.GetByIdWithDetailsAsync(request.Id))
      .ReturnsAsync(request);

    var bookingScheduleService = new Mock<IBookingScheduleService>();
    bookingScheduleService
      .Setup(service => service.ParseAndValidate(request.TimeSlots, request.HoursPerSession))
      .Returns(requestedSlots);

    var bookingOrchestrator = new Mock<IBookingOrchestrator>();
    bookingOrchestrator
      .Setup(service => service.SoftBookAsync(request.Id, request.TutorId, requestedSlots, null))
      .ThrowsAsync(new ConflictException("Schedule conflict.", "LEARNING_REQUEST_SCHEDULE_CONFLICT"));

    var notificationService = new Mock<INotificationService>();

    var service = new TutorLearningRequestService(
      learningRequestRepository.Object,
      bookingScheduleService.Object,
      bookingOrchestrator.Object,
      notificationService.Object);

    var response = await service.AcceptAsync(request.Id, request.TutorId);

    Assert.False(response.Success);
    Assert.Equal(409, response.StatusCode);
    Assert.Null(response.Data);
    Assert.Equal("Schedule conflict.", response.Message);
    notificationService.Verify(
      service => service.SendAsync(
        It.IsAny<long>(),
        It.IsAny<string>(),
        It.IsAny<string>(),
        It.IsAny<NotificationType>(),
        It.IsAny<string?>(),
        It.IsAny<long?>(),
        It.IsAny<string?>()),
      Times.Never);
  }

  [Fact]
  public async Task ScheduleProposalAcceptAsync_ReturnsConflictResponse_WhenSoftBookConflicts()
  {
    var proposal = CreateScheduleProposal();
    var requestedSlots = CreateSlots();

    var learningRequestRepository = new Mock<ILearningRequestRepository>();
    var scheduleProposalRepository = new Mock<IScheduleProposalRepository>();
    scheduleProposalRepository
      .Setup(repo => repo.GetByIdWithDetailsAsync(proposal.Id))
      .ReturnsAsync(proposal);

    var depositPolicyRepository = new Mock<IDepositPolicyRepository>();
    var notificationService = new Mock<INotificationService>();

    var bookingScheduleService = new Mock<IBookingScheduleService>();
    bookingScheduleService
      .Setup(service => service.ParseAndValidate(proposal.TimeSlots, proposal.HoursPerSession))
      .Returns(requestedSlots);

    var bookingOrchestrator = new Mock<IBookingOrchestrator>();
    bookingOrchestrator
      .Setup(service => service.SoftBookAsync(
        proposal.LearningRequest.Id,
        proposal.ProposedBy,
        requestedSlots,
        proposal.Id))
      .ThrowsAsync(new ConflictException("Schedule conflict.", "LEARNING_REQUEST_SCHEDULE_CONFLICT"));

    var depositCalculator = new Mock<IDepositCalculator>();

    var service = new ScheduleProposalService(
      learningRequestRepository.Object,
      scheduleProposalRepository.Object,
      depositPolicyRepository.Object,
      notificationService.Object,
      bookingScheduleService.Object,
      bookingOrchestrator.Object,
      depositCalculator.Object);

    var response = await service.AcceptAsync(proposal.Id, proposal.LearningRequest.StudentId);

    Assert.False(response.Success);
    Assert.Equal(409, response.StatusCode);
    Assert.Null(response.Data);
    Assert.Equal("Schedule conflict.", response.Message);
    notificationService.Verify(
      service => service.SendAsync(
        It.IsAny<long>(),
        It.IsAny<string>(),
        It.IsAny<string>(),
        It.IsAny<NotificationType>(),
        It.IsAny<string?>(),
        It.IsAny<long?>(),
        It.IsAny<string?>()),
      Times.Never);
  }

  private static LearningRequest CreateLearningRequest(LearningRequestStatus status)
  {
    var tutorUser = new User { Id = 11, FullName = "Tutor User" };
    var tutor = new Tutor { Id = 2, UserId = tutorUser.Id, User = tutorUser, Code = "T-001", Major = "Math" };

    return new LearningRequest
    {
      Id = 1,
      StudentId = 3,
      TutorId = tutor.Id,
      SubjectId = 4,
      Subject = new Subject { Id = 4, Name = "Math" },
      Tutor = tutor,
      Student = new User { Id = 3, FullName = "Student User" },
      TimeSlots = "[]",
      DesiredStartDate = DateTime.UtcNow.Date,
      HoursPerSession = 2,
      BudgetPerHour = 150_000m,
      CalculatedDepositAmount = 300_000m,
      ScheduleExpiresAt = DateTime.UtcNow.AddDays(1),
      Status = status
    };
  }

  private static ScheduleProposal CreateScheduleProposal()
  {
    var learningRequest = CreateLearningRequest(LearningRequestStatus.Negotiating);
    var tutorUser = learningRequest.Tutor.User;

    return new ScheduleProposal
    {
      Id = 9,
      LearningRequestId = learningRequest.Id,
      LearningRequest = learningRequest,
      ProposedBy = learningRequest.TutorId,
      RoundNumber = 2,
      TimeSlots = "[]",
      DesiredStartDate = DateTime.UtcNow.Date,
      HoursPerSession = 2,
      HourlyRate = 150_000m,
      CalculatedDepositAmount = 300_000m,
      Status = ScheduleProposalStatus.Pending,
      Tutor = new Tutor
      {
        Id = learningRequest.TutorId,
        UserId = tutorUser.Id,
        User = tutorUser,
        Code = "T-001",
        Major = "Math"
      }
    };
  }

  private static IReadOnlyList<BookingTimeSlot> CreateSlots()
  {
    return
    [
      new BookingTimeSlot(DayOfWeek.Monday, new TimeOnly(8, 0), new TimeOnly(10, 0))
    ];
  }
}
