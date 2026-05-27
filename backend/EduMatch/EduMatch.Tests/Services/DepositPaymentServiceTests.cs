using System.Net;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Configurations;
using EduMatch.Domain.Booking.Scheduling;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services;
using EduMatch.Services.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;

namespace EduMatch.Tests.Services;

public class DepositPaymentServiceTests
{
  [Fact]
  public async Task GetStatusAsync_SyncsPaidPayOSPayment_AndCreatesClass()
  {
    const long orderCode = 260527120426672;
    var payment = CreatePendingPayment(orderCode, amount: 10000m);
    var service = CreateService(
      payment,
      PayOsResponse(orderCode, 10000m, "PAID"),
      out var paymentRepository,
      out var classRepository);

    var result = await service.GetStatusAsync(orderCode);

    Assert.Equal(PaymentStatus.Success, result.Status);
    Assert.Equal(321, result.ClassId);
    Assert.NotNull(result.PaidAt);
    Assert.Equal(PaymentStatus.Success, payment.Status);
    Assert.Equal(321, payment.ClassId);
    Assert.Equal(LearningRequestStatus.ConvertedToClass, payment.LearningRequest!.Status);
    classRepository.Verify(repo => repo.AddAsync(It.IsAny<Class>()), Times.Once);
    paymentRepository.Verify(repo => repo.SaveChangesAsync(), Times.AtLeastOnce);
  }

  [Fact]
  public async Task GetStatusAsync_KeepsPendingPayment_WhenPayOSIsStillPending()
  {
    const long orderCode = 260527120426673;
    var payment = CreatePendingPayment(orderCode, amount: 10000m);
    var service = CreateService(
      payment,
      PayOsResponse(orderCode, 10000m, "PENDING"),
      out _,
      out var classRepository);

    var result = await service.GetStatusAsync(orderCode);

    Assert.Equal(PaymentStatus.Pending, result.Status);
    Assert.Null(result.ClassId);
    Assert.Equal(PaymentStatus.Pending, payment.Status);
    Assert.Null(payment.ClassId);
    Assert.Equal(LearningRequestStatus.SoftBooked, payment.LearningRequest!.Status);
    classRepository.Verify(repo => repo.AddAsync(It.IsAny<Class>()), Times.Never);
  }

  [Fact]
  public async Task GetStatusAsync_DoesNotCreateDuplicateClass_WhenSuccessfulPaymentAlreadyHasClass()
  {
    const long orderCode = 260527120426674;
    var payment = CreatePendingPayment(orderCode, amount: 10000m);
    payment.Status = PaymentStatus.Success;
    payment.ClassId = 55;
    payment.Class = new Class { Id = 55, Code = "CLS00055" };
    var service = CreateService(
      payment,
      responseBody: null,
      out _,
      out var classRepository);

    var result = await service.GetStatusAsync(orderCode);

    Assert.Equal(PaymentStatus.Success, result.Status);
    Assert.Equal(55, result.ClassId);
    classRepository.Verify(repo => repo.AddAsync(It.IsAny<Class>()), Times.Never);
  }

  [Fact]
  public async Task GetStatusAsync_ThrowsAndDoesNotCreateClass_WhenPayOSAmountMismatches()
  {
    const long orderCode = 260527120426675;
    var payment = CreatePendingPayment(orderCode, amount: 10000m);
    var service = CreateService(
      payment,
      PayOsResponse(orderCode, 20000m, "PAID"),
      out _,
      out var classRepository);

    var exception = await Assert.ThrowsAsync<AppException>(() => service.GetStatusAsync(orderCode));

    Assert.Equal("PAYOS_AMOUNT_MISMATCH", exception.ErrorCode);
    Assert.Equal(PaymentStatus.Pending, payment.Status);
    Assert.Null(payment.ClassId);
    classRepository.Verify(repo => repo.AddAsync(It.IsAny<Class>()), Times.Never);
  }

  private static DepositPaymentService CreateService(
    Payment payment,
    string? responseBody,
    out Mock<IPaymentRepository> paymentRepository,
    out Mock<IClassRepository> classRepository)
  {
    paymentRepository = new Mock<IPaymentRepository>();
    paymentRepository
      .Setup(repo => repo.GetByOrderCodeWithLearningRequestAsync(payment.OrderCode))
      .ReturnsAsync(payment);
    paymentRepository
      .Setup(repo => repo.SaveChangesAsync())
      .ReturnsAsync(1);

    classRepository = new Mock<IClassRepository>();
    classRepository
      .Setup(repo => repo.AddAsync(It.IsAny<Class>()))
      .Callback<Class>(classEntity => classEntity.Id = 321)
      .Returns(Task.CompletedTask);
    classRepository
      .Setup(repo => repo.SaveChangesAsync())
      .ReturnsAsync(1);

    var codeGenerator = new Mock<ICodeGeneratorService>();
    codeGenerator
      .Setup(service => service.GenerateTemporaryCode("CLS"))
      .Returns("TMP-CLS");
    codeGenerator
      .Setup(service => service.GenerateClassCode(It.IsAny<long>()))
      .Returns<long>(id => $"CLS{id:D5}");

    var httpClient = new HttpClient(new StubHttpMessageHandler(responseBody))
    {
      BaseAddress = new Uri("https://api-merchant.payos.vn")
    };

    return new DepositPaymentService(
      paymentRepository.Object,
      classRepository.Object,
      Mock.Of<ILearningRequestRepository>(),
      Mock.Of<INotificationService>(),
      codeGenerator.Object,
      new BookingScheduleService(),
      httpClient,
      Options.Create(new PayOSSettings
      {
        ClientId = "client-id",
        ApiKey = "api-key",
        ChecksumKey = "checksum-key",
        BaseUrl = "https://api-merchant.payos.vn",
        ReturnUrl = "http://localhost:4200/payment/success",
        CancelUrl = "http://localhost:4200/payment/cancel"
      }),
      Mock.Of<ILogger<DepositPaymentService>>());
  }

  private static Payment CreatePendingPayment(long orderCode, decimal amount)
  {
    var tutor = new Tutor
    {
      Id = 2,
      UserId = 20,
      Code = "TUT00002"
    };

    var learningRequest = new LearningRequest
    {
      Id = 6,
      StudentId = 10,
      TutorId = tutor.Id,
      Tutor = tutor,
      SubjectId = 1,
      TimeSlots = """[{ "day": "Monday", "startTime": "17:00", "endTime": "18:00" }]""",
      DesiredStartDate = new DateTime(2026, 6, 3, 0, 0, 0, DateTimeKind.Utc),
      HoursPerSession = 1m,
      BudgetPerHour = 10000m,
      CalculatedDepositAmount = amount,
      ScheduleExpiresAt = DateTime.UtcNow.AddHours(1),
      PaymentExpiresAt = DateTime.UtcNow.AddHours(1),
      Status = LearningRequestStatus.SoftBooked
    };

    return new Payment
    {
      Id = 100,
      LearningRequestId = learningRequest.Id,
      LearningRequest = learningRequest,
      PaidByUserId = learningRequest.StudentId,
      Amount = amount,
      OrderCode = orderCode,
      Description = $"Dat coc LR#{learningRequest.Id}",
      Status = PaymentStatus.Pending
    };
  }

  private static string PayOsResponse(long orderCode, decimal amount, string status)
  {
    return $$"""
      {
        "code": "00",
        "desc": "success",
        "data": {
          "id": "payment-link-{{orderCode}}",
          "orderCode": {{orderCode}},
          "amount": {{amount}},
          "amountPaid": {{(status == "PAID" ? amount : 0m)}},
          "amountRemaining": {{(status == "PAID" ? 0m : amount)}},
          "status": "{{status}}"
        },
        "signature": "signature"
      }
      """;
  }

  private sealed class StubHttpMessageHandler : HttpMessageHandler
  {
    private readonly string? _responseBody;

    public StubHttpMessageHandler(string? responseBody)
    {
      _responseBody = responseBody;
    }

    protected override Task<HttpResponseMessage> SendAsync(
      HttpRequestMessage request,
      CancellationToken cancellationToken)
    {
      if (_responseBody == null)
      {
        throw new InvalidOperationException("HTTP sync should not be called for this test.");
      }

      return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
      {
        Content = new StringContent(_responseBody)
      });
    }
  }
}
