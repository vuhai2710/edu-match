using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Configurations;
using EduMatch.Domain.Booking.Scheduling;
using EduMatch.DTOs;
using EduMatch.DTOs.Payment;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace EduMatch.Services
{
  public class DepositPaymentService : IDepositPaymentService
  {
    private readonly IPaymentRepository _paymentRepo;
    private readonly IClassRepository _classRepo;
    private readonly ILearningRequestRepository _learningRequestRepo;
    private readonly IUserRepository _userRepository;
    private readonly INotificationService _notificationService;
    private readonly ICodeGeneratorService _codeGeneratorService;
    private readonly IBookingScheduleService _bookingScheduleService;
    private readonly HttpClient _httpClient;
    private readonly PayOSSettings _settings;
    private readonly ILogger<DepositPaymentService> _logger;

    public DepositPaymentService(
      IPaymentRepository paymentRepo,
      IClassRepository classRepo,
      ILearningRequestRepository learningRequestRepo,
      IUserRepository userRepository,
      INotificationService notificationService,
      ICodeGeneratorService codeGeneratorService,
      IBookingScheduleService bookingScheduleService,
      HttpClient httpClient,
      IOptions<PayOSSettings> options,
      ILogger<DepositPaymentService> logger)
    {
      _paymentRepo = paymentRepo;
      _classRepo = classRepo;
      _learningRequestRepo = learningRequestRepo;
      _userRepository = userRepository;
      _notificationService = notificationService;
      _codeGeneratorService = codeGeneratorService;
      _bookingScheduleService = bookingScheduleService;
      _httpClient = httpClient;
      _settings = options.Value;
      _logger = logger;

      _httpClient.BaseAddress = new Uri(_settings.BaseUrl);
      _httpClient.DefaultRequestHeaders.Add("x-client-id", _settings.ClientId);
      _httpClient.DefaultRequestHeaders.Add("x-api-key", _settings.ApiKey);
    }

    public async Task<ApiResponse<PaymentResponseDto>> CreateDepositAsync(long callerUserId, CreateDepositPaymentRequest dto)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var lr = await _learningRequestRepo.GetByIdWithDetailsAsync(dto.LearningRequestId);
        if (lr == null)
        {
          throw new NotFoundException("Không tìm thấy yêu cầu học tập.", "LEARNING_REQUEST_NOT_FOUND");
        }

        var isStudent = callerUserId == lr.StudentId;
        var isTutor = callerUserId == lr.Tutor.UserId;
        if (!isStudent && !isTutor)
        {
          throw new ForbiddenException(
            "Bạn không có quyền thanh toán cho yêu cầu học tập này.",
            "DEPOSIT_PAYMENT_FORBIDDEN");
        }

        if (lr.Status != LearningRequestStatus.SoftBooked)
        {
          throw new ConflictException(
            "Chỉ có thể thanh toán đặt cọc khi yêu cầu học tập ở trạng thái SoftBooked.",
            "LEARNING_REQUEST_NOT_SOFT_BOOKED");
        }

        if (lr.PaymentExpiresAt.HasValue && lr.PaymentExpiresAt.Value < DateTime.UtcNow)
        {
          throw new ConflictException(
            "Thời hạn thanh toán đặt cọc đã hết hạn.",
            "PAYMENT_WINDOW_EXPIRED");
        }

        var hasPending = await _paymentRepo.HasPendingPaymentForLearningRequestAsync(dto.LearningRequestId);
        if (hasPending)
        {
          throw new ConflictException(
            "Đã tồn tại một khoản thanh toán đang chờ cho yêu cầu học tập này.",
            "DUPLICATE_PENDING_PAYMENT");
        }

        var depositAmount = lr.CalculatedDepositAmount;
        if (depositAmount <= 0)
        {
          throw new ValidationException(
            "Số tiền đặt cọc không hợp lệ.",
            "INVALID_DEPOSIT_AMOUNT");
        }

        long orderCode = GenerateOrderCode();
        string description = $"Dat coc LR#{dto.LearningRequestId}"
          .Substring(0, Math.Min(25, $"Dat coc LR#{dto.LearningRequestId}".Length));

        var payment = new Payment
        {
          LearningRequestId = dto.LearningRequestId,
          PaidByUserId = callerUserId,
          TutorId = lr.TutorId,
          Amount = depositAmount,
          OrderCode = orderCode,
          Description = description,
          Status = PaymentStatus.Pending
        };

        await _paymentRepo.AddAsync(payment);
        await _paymentRepo.SaveChangesAsync();

        var reqData = new
        {
          orderCode,
          amount = (int)depositAmount,
          description,
          cancelUrl = _settings.CancelUrl,
          returnUrl = _settings.ReturnUrl + "?orderCode=" + orderCode
        };

        string signatureData = $"amount={reqData.amount}&cancelUrl={reqData.cancelUrl}&description={reqData.description}&orderCode={reqData.orderCode}&returnUrl={reqData.returnUrl}";
        string signature = ComputeHmacSha256(signatureData, _settings.ChecksumKey);

        var payOsPayload = new
        {
          reqData.orderCode,
          reqData.amount,
          reqData.description,
          reqData.cancelUrl,
          reqData.returnUrl,
          signature
        };

        var response = await _httpClient.PostAsJsonAsync("/v2/payment-requests", payOsPayload);

        if (!response.IsSuccessStatusCode)
        {
          var errorText = await response.Content.ReadAsStringAsync();
          _logger.LogError("PayOS API Error: {Error}", errorText);
          throw new AppException("Không thể tạo thanh toán với PayOS.", StatusCodes.Status502BadGateway, "PAYOS_API_ERROR");
        }

        var rsString = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(rsString);
        var root = doc.RootElement;
        var code = root.GetProperty("code").GetString();
        if (code != "00")
        {
          _logger.LogError("PayOS API returned code {Code}, msg: {Msg}", code, root.GetProperty("desc").GetString());
          throw new AppException("PayOS từ chối yêu cầu thanh toán.", StatusCodes.Status502BadGateway, "PAYOS_API_REJECTED");
        }

        var dataElem = root.GetProperty("data");
        var checkoutUrl = dataElem.GetProperty("checkoutUrl").GetString()!;

        payment.CheckoutUrl = checkoutUrl;
        _paymentRepo.Update(payment);
        await _paymentRepo.SaveChangesAsync();

        _logger.LogInformation(
          "Created deposit payment for LearningRequest {LearningRequestId}, orderCode={OrderCode}, paidBy={UserId}",
          dto.LearningRequestId, orderCode, callerUserId);

        await _notificationService.SendToMultipleAsync(
          new[] { lr.StudentId, lr.Tutor.UserId },
          "Yêu cầu thanh toán đặt cọc",
          $"Yêu cầu thanh toán đặt cọc đã được tạo cho yêu cầu học tập #{dto.LearningRequestId}.",
          NotificationType.DepositPaymentCreated,
          "Payment",
          payment.Id,
          $"/payments/deposit?orderCode={orderCode}");

        return ApiResponse<PaymentResponseDto>.SuccessResult(new PaymentResponseDto
        {
          LearningRequestId = dto.LearningRequestId,
          OrderCode = orderCode,
          CheckoutUrl = checkoutUrl,
          Status = payment.Status
        });
      });
    }

    public async Task<ApiResponse<DepositPaymentDto?>> GetByLearningRequestAsync(long callerUserId, bool isAdmin, long learningRequestId)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var lr = await _learningRequestRepo.GetByIdWithDetailsAsync(learningRequestId);
        if (lr == null)
        {
          throw new NotFoundException("Không tìm thấy yêu cầu học tập.", "LEARNING_REQUEST_NOT_FOUND");
        }

        if (!isAdmin && callerUserId != lr.StudentId && callerUserId != lr.Tutor.UserId)
        {
          throw new ForbiddenException(
            "Bạn không có quyền xem thanh toán cho yêu cầu học tập này.",
            "DEPOSIT_PAYMENT_FORBIDDEN");
        }

        var payment = await _paymentRepo.GetLatestByLearningRequestIdWithDetailsAsync(learningRequestId);
        return ApiResponse<DepositPaymentDto?>.SuccessResult(payment == null ? null : MapDepositPayment(payment));
      });
    }

    public async Task HandleWebhookAsync(PayOSWebhookDto dto)
    {
      if (dto.Data == null) return;

      var isValid = VerifyWebhookSignature(dto);
      if (!isValid)
      {
        _logger.LogWarning("Invalid webhook signature for order {OrderCode}", dto.Data.OrderCode);
        throw new AppException("Chữ ký webhook không hợp lệ.", StatusCodes.Status400BadRequest, "INVALID_WEBHOOK_SIGNATURE");
      }

      var payment = await _paymentRepo.GetByOrderCodeWithLearningRequestAsync(dto.Data.OrderCode);
      if (payment == null) return;

      if (payment.Amount != dto.Data.Amount)
      {
        _logger.LogWarning(
          "Amount mismatch for order {OrderCode}: expected={Expected}, received={Received}",
          dto.Data.OrderCode, payment.Amount, dto.Data.Amount);
        throw new AppException("Số tiền không khớp.", StatusCodes.Status400BadRequest, "AMOUNT_MISMATCH");
      }

      if (payment.Status == PaymentStatus.Success)
      {
        if (!payment.ClassId.HasValue && payment.LearningRequest != null)
        {
          await MarkPaymentSuccessfulAndFinalizeAsync(
            payment,
            payment.RawWebhookData ?? "{}",
            payment.TransactionId,
            "webhook-idempotent");
        }

        return;
      }

      var dataJson = JsonSerializer.Serialize(dto.Data);

      if (dto.Code == "00" && dto.Data.Code == "00")
      {
        await MarkPaymentSuccessfulAndFinalizeAsync(payment, dataJson, dto.Data.Reference, "webhook");

        _logger.LogInformation(
          "Webhook success for order {OrderCode}, LearningRequest {LearningRequestId}",
          dto.Data.OrderCode, payment.LearningRequestId);

        if (payment.LearningRequest != null)
        {
          await _notificationService.SendToMultipleAsync(
            new[] { payment.LearningRequest.StudentId, payment.LearningRequest.Tutor.UserId },
            "Thanh toán đặt cọc thành công",
            $"Đặt cọc cho yêu cầu học tập #{payment.LearningRequestId} đã thanh toán thành công. Lớp học đã được tạo.",
            NotificationType.DepositPaymentSuccess,
            "Payment",
            payment.Id,
            $"/classes");
        }
      }
      else
      {
        payment.Status = PaymentStatus.Failed;
        payment.RawWebhookData = dataJson;
        _paymentRepo.Update(payment);
        await _paymentRepo.SaveChangesAsync();

        _logger.LogWarning(
          "Webhook failed for order {OrderCode}, code={Code}, dataCode={DataCode}",
          dto.Data.OrderCode, dto.Code, dto.Data.Code);
      }
    }

    public async Task<ApiResponse<PaymentStatusDto>> GetStatusAsync(long orderCode)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var payment = await _paymentRepo.GetByOrderCodeWithLearningRequestAsync(orderCode);
        if (payment == null)
        {
          throw new NotFoundException("Không tìm thấy thanh toán.", "PAYMENT_NOT_FOUND");
        }

        if (payment.Status == PaymentStatus.Pending)
        {
          await SyncPendingPaymentFromPayOSAsync(payment);
        }

        if (payment.Status == PaymentStatus.Success
            && !payment.ClassId.HasValue
            && payment.LearningRequest != null)
        {
          await MarkPaymentSuccessfulAndFinalizeAsync(
            payment,
            payment.RawWebhookData ?? "{}",
            payment.TransactionId,
            "status-read");
        }

        return ApiResponse<PaymentStatusDto>.SuccessResult(new PaymentStatusDto
        {
          OrderCode = payment.OrderCode,
          LearningRequestId = payment.LearningRequestId,
          ClassId = payment.ClassId,
          Amount = payment.Amount,
          Status = payment.Status,
          PaidAt = payment.PaidAt
        });
      });
    }

    private async Task SyncPendingPaymentFromPayOSAsync(Payment payment)
    {
      HttpResponseMessage response;
      try
      {
        response = await _httpClient.GetAsync($"/v2/payment-requests/{payment.OrderCode}");
      }
      catch (HttpRequestException ex)
      {
        _logger.LogWarning(ex, "Unable to sync pending payment {OrderCode} from PayOS", payment.OrderCode);
        return;
      }

      if (!response.IsSuccessStatusCode)
      {
        var errorText = await response.Content.ReadAsStringAsync();
        _logger.LogWarning(
          "PayOS payment sync failed for order {OrderCode}: HTTP {StatusCode}, body={Body}",
          payment.OrderCode,
          response.StatusCode,
          errorText);
        return;
      }

      var responseText = await response.Content.ReadAsStringAsync();
      using var doc = JsonDocument.Parse(responseText);
      var root = doc.RootElement;

      if (!root.TryGetProperty("code", out var codeElement)
          || codeElement.GetString() != "00"
          || !root.TryGetProperty("data", out var data))
      {
        _logger.LogWarning(
          "PayOS payment sync returned non-success response for order {OrderCode}: {Response}",
          payment.OrderCode,
          responseText);
        return;
      }

      var payOsOrderCode = GetInt64(data, "orderCode");
      if (payOsOrderCode != payment.OrderCode)
      {
        _logger.LogWarning(
          "PayOS payment sync order mismatch: local={LocalOrderCode}, remote={RemoteOrderCode}",
          payment.OrderCode,
          payOsOrderCode);
        throw new AppException(
          "Mã thanh toán PayOS không khớp.",
          StatusCodes.Status400BadRequest,
          "PAYOS_ORDER_MISMATCH");
      }

      var payOsAmount = GetDecimal(data, "amount");
      if (payOsAmount != payment.Amount)
      {
        _logger.LogWarning(
          "PayOS payment sync amount mismatch for order {OrderCode}: expected={Expected}, received={Received}",
          payment.OrderCode,
          payment.Amount,
          payOsAmount);
        throw new AppException(
          "Số tiền PayOS không khớp.",
          StatusCodes.Status400BadRequest,
          "PAYOS_AMOUNT_MISMATCH");
      }

      var payOsStatus = GetString(data, "status");
      if (string.Equals(payOsStatus, "PAID", StringComparison.OrdinalIgnoreCase))
      {
        var transactionId = GetString(data, "id") ?? GetString(data, "paymentLinkId");
        await MarkPaymentSuccessfulAndFinalizeAsync(payment, data.GetRawText(), transactionId, "status-sync");
        return;
      }

      if (string.Equals(payOsStatus, "CANCELLED", StringComparison.OrdinalIgnoreCase))
      {
        payment.Status = PaymentStatus.Cancelled;
        payment.RawWebhookData = data.GetRawText();
        _paymentRepo.Update(payment);
        await _paymentRepo.SaveChangesAsync();
      }
    }

    private async Task MarkPaymentSuccessfulAndFinalizeAsync(
      Payment payment,
      string rawData,
      string? transactionId,
      string source)
    {
      var wasSuccessful = payment.Status == PaymentStatus.Success;

      payment.Status = PaymentStatus.Success;
      payment.TransactionId = string.IsNullOrWhiteSpace(transactionId)
        ? payment.TransactionId
        : transactionId;
      payment.PaidAt ??= DateTime.UtcNow;
      payment.RawWebhookData = rawData;

      _paymentRepo.Update(payment);

      var classCreated = false;
      if (!payment.ClassId.HasValue && payment.LearningRequest != null)
      {
        var newClass = await FinalizeClassFromLearningRequest(payment, source);
        payment.ClassId = newClass.Id;
        _paymentRepo.Update(payment);
        classCreated = true;
      }

      await _paymentRepo.SaveChangesAsync();

      if (payment.LearningRequest == null)
      {
        return;
      }

      if (source != "webhook" && (classCreated || !wasSuccessful))
      {
        await NotifyParticipantsOfSuccessfulDepositAsync(payment);
      }

      if (classCreated)
      {
        await NotifyAdminsOfCreatedClassAsync(payment);
      }
    }

    private async Task<Class> FinalizeClassFromLearningRequest(Payment payment, string source)
    {
      var lr = payment.LearningRequest!;

      string timeSlotsJson;
      decimal hoursPerSession;
      AcceptedScheduleSource scheduleSource;
      long? acceptedProposalId = null;
      decimal depositSnapshot;
      DateTime startDate;

      var acceptedProposal = lr.ScheduleProposal != null
        && lr.ScheduleProposal.Status == ScheduleProposalStatus.Accepted
          ? lr.ScheduleProposal
          : null;

      if (acceptedProposal != null)
      {
        scheduleSource = AcceptedScheduleSource.R2;
        acceptedProposalId = acceptedProposal.Id;
        hoursPerSession = acceptedProposal.HoursPerSession;
        depositSnapshot = acceptedProposal.CalculatedDepositAmount;
        startDate = acceptedProposal.DesiredStartDate;

        var normalizedSlots = _bookingScheduleService.ParseAndValidate(
          acceptedProposal.TimeSlots, hoursPerSession);
        timeSlotsJson = SerializeTimeSlots(normalizedSlots);
      }
      else
      {
        scheduleSource = AcceptedScheduleSource.R1;
        hoursPerSession = lr.HoursPerSession;
        depositSnapshot = lr.CalculatedDepositAmount;
        startDate = lr.DesiredStartDate;

        var normalizedSlots = _bookingScheduleService.ParseAndValidate(
          lr.TimeSlots, hoursPerSession);
        timeSlotsJson = SerializeTimeSlots(normalizedSlots);
      }

      var newClass = new Class
      {
        StudentId = lr.StudentId,
        TutorId = lr.TutorId,
        LearningRequestId = lr.Id,
        SubjectId = lr.SubjectId,
        TimeSlotsJson = timeSlotsJson,
        AcceptedScheduleSource = scheduleSource,
        AcceptedScheduleProposalId = acceptedProposalId,
        DepositAmountSnapshot = depositSnapshot,
        DepositAmount = payment.Amount,
        StartDate = startDate,
        Status = ClassStatus.PendingStart,
        Code = _codeGeneratorService.GenerateTemporaryCode("CLS")
      };

      await _classRepo.AddAsync(newClass);
      await _classRepo.SaveChangesAsync();

      newClass.Code = _codeGeneratorService.GenerateClassCode(newClass.Id);
      _classRepo.Update(newClass);

      lr.Status = LearningRequestStatus.ConvertedToClass;
      await _paymentRepo.SaveChangesAsync();

      _logger.LogInformation(
        "Created Class {ClassId} from LearningRequest {LearningRequestId}, source={Source}",
        newClass.Id, lr.Id, source);

      return newClass;
    }

    private async Task NotifyParticipantsOfSuccessfulDepositAsync(Payment payment)
    {
      var learningRequest = payment.LearningRequest;
      var tutorUserId = learningRequest?.Tutor?.UserId;
      if (learningRequest == null || !tutorUserId.HasValue)
      {
        _logger.LogWarning(
          "Skipping participant payment notification for order {OrderCode} because LearningRequest/Tutor data is incomplete.",
          payment.OrderCode);
        return;
      }

      var actionUrl = payment.ClassId.HasValue
        ? $"/classes/{payment.ClassId.Value}"
        : "/classes";

      await _notificationService.SendToMultipleAsync(
        new[] { learningRequest.StudentId, tutorUserId.Value },
        "Thanh toán đặt cọc thành công",
        $"Đặt cọc cho yêu cầu học tập #{payment.LearningRequestId} đã thành công. Lớp học đã được tạo.",
        NotificationType.DepositPaymentSuccess,
        "Payment",
        payment.Id,
        actionUrl);
    }

    private async Task NotifyAdminsOfCreatedClassAsync(Payment payment)
    {
      if (!payment.ClassId.HasValue)
      {
        return;
      }

      var adminIds = await GetAdminUserIdsAsync();
      if (adminIds.Count == 0)
      {
        return;
      }

      await _notificationService.SendToMultipleAsync(
        adminIds,
        "Lớp học mới được tạo",
        $"Lớp học mới được tạo từ yêu cầu học tập #{payment.LearningRequestId} sau khi học viên thanh toán thành công.",
        NotificationType.ClassCreated,
        "Class",
        payment.ClassId.Value,
        $"/admin/classes/{payment.ClassId.Value}");
    }

    private async Task<List<long>> GetAdminUserIdsAsync()
    {
      var admins = await _userRepository.FindAsync(x => x.Role == UserRole.Admin);
      return admins
        .Select(x => x.Id)
        .Distinct()
        .ToList();
    }

    private static DepositPaymentDto MapDepositPayment(Payment payment)
    {
      return new DepositPaymentDto
      {
        Id = payment.Id,
        LearningRequestId = payment.LearningRequestId,
        PaidByUserId = payment.PaidByUserId,
        ClassId = payment.ClassId,
        TutorId = payment.TutorId ?? payment.LearningRequest?.TutorId,
        OrderCode = payment.OrderCode,
        Amount = payment.Amount,
        CheckoutUrl = payment.CheckoutUrl,
        Status = payment.Status,
        TransactionId = payment.TransactionId,
        PaidAt = payment.PaidAt,
        CreatedAt = payment.CreatedAt
      };
    }

    private bool VerifyWebhookSignature(PayOSWebhookDto dto)
    {
      if (dto.Data == null || string.IsNullOrEmpty(dto.Signature))
      {
        return false;
      }

      var sortedData = new SortedDictionary<string, string>(StringComparer.Ordinal)
      {
        ["accountNumber"] = dto.Data.AccountNumber ?? "",
        ["amount"] = ((int)dto.Data.Amount).ToString(),
        ["code"] = dto.Data.Code ?? "",
        ["counterAccountBankId"] = dto.Data.CounterAccountBankId ?? "",
        ["counterAccountBankName"] = dto.Data.CounterAccountBankName ?? "",
        ["counterAccountName"] = dto.Data.CounterAccountName ?? "",
        ["counterAccountNumber"] = dto.Data.CounterAccountNumber ?? "",
        ["currency"] = dto.Data.Currency ?? "",
        ["desc"] = dto.Data.Desc ?? "",
        ["description"] = dto.Data.Description ?? "",
        ["orderCode"] = dto.Data.OrderCode.ToString(),
        ["paymentLinkId"] = dto.Data.PaymentLinkId ?? "",
        ["reference"] = dto.Data.Reference ?? "",
        ["transactionDateTime"] = dto.Data.TransactionDateTime ?? "",
        ["virtualAccountName"] = dto.Data.VirtualAccountName ?? "",
        ["virtualAccountNumber"] = dto.Data.VirtualAccountNumber ?? ""
      };

      var signatureData = string.Join("&", sortedData.Select(kv => $"{kv.Key}={kv.Value}"));
      var expectedSignature = ComputeHmacSha256(signatureData, _settings.ChecksumKey);

      return string.Equals(dto.Signature, expectedSignature, StringComparison.OrdinalIgnoreCase);
    }

    private static string ComputeHmacSha256(string data, string key)
    {
      using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(key));
      var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
      return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }

    private static long GetInt64(JsonElement element, string propertyName)
    {
      if (!element.TryGetProperty(propertyName, out var value))
      {
        return 0;
      }

      return value.ValueKind switch
      {
        JsonValueKind.Number when value.TryGetInt64(out var number) => number,
        JsonValueKind.String when long.TryParse(value.GetString(), out var number) => number,
        _ => 0
      };
    }

    private static decimal GetDecimal(JsonElement element, string propertyName)
    {
      if (!element.TryGetProperty(propertyName, out var value))
      {
        return 0m;
      }

      return value.ValueKind switch
      {
        JsonValueKind.Number when value.TryGetDecimal(out var number) => number,
        JsonValueKind.String when decimal.TryParse(value.GetString(), out var number) => number,
        _ => 0m
      };
    }

    private static string? GetString(JsonElement element, string propertyName)
    {
      if (!element.TryGetProperty(propertyName, out var value)
          || value.ValueKind == JsonValueKind.Null
          || value.ValueKind == JsonValueKind.Undefined)
      {
        return null;
      }

      return value.GetString();
    }

    private static long GenerateOrderCode()
    {
      return long.Parse(DateTime.Now.ToString("yyMMddHHmmss") + new Random().Next(100, 999).ToString());
    }

    private static string SerializeTimeSlots(IReadOnlyList<BookingTimeSlot> slots)
    {
      var serializable = slots.Select(s => new
      {
        day = s.Day.ToString(),
        startTime = s.StartTime.ToString("HH:mm"),
        endTime = s.EndTime.ToString("HH:mm")
      });

      return JsonSerializer.Serialize(serializable, new JsonSerializerOptions
      {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
      });
    }

    public async Task<ApiResponse<PagedResult<PaymentAdminDto>>> GetMyPaymentsAsync(long userId, int page, int pageSize, PaymentStatus? status)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var pagedPayments = await _paymentRepo.GetPagedByUserIdAsync(userId, page, pageSize, status);
        var mappedItems = pagedPayments.Items.Select(MapPayment).ToList();

        var result = new PagedResult<PaymentAdminDto>
        {
          Items = mappedItems,
          TotalCount = pagedPayments.TotalCount,
          Page = pagedPayments.Page,
          PageSize = pagedPayments.PageSize,
          TotalPages = pagedPayments.TotalPages
        };

        return ApiResponse<PagedResult<PaymentAdminDto>>.SuccessResult(result);
      });
    }

    public async Task<ApiResponse<PaymentAdminDto>> GetMyPaymentByIdAsync(long userId, long id)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var payment = await _paymentRepo.GetByIdAsync(id);
        if (payment == null)
        {
          throw new NotFoundException("Không tìm thấy thông tin thanh toán.", "PAYMENT_NOT_FOUND");
        }

        if (payment.PaidByUserId != userId && payment.TutorId != userId && payment.LearningRequest?.TutorId != userId)
        {
          throw new ForbiddenException("Bạn không có quyền xem thông tin thanh toán này.", "PAYMENT_ACCESS_FORBIDDEN");
        }

        return ApiResponse<PaymentAdminDto>.SuccessResult(MapPayment(payment));
      });
    }

    private static PaymentAdminDto MapPayment(Payment payment)
    {
      string? paidByUserName = payment.PaidByUser?.FullName;
      string? paidByUserCode = payment.PaidByUser?.Student?.Code ?? payment.PaidByUser?.Tutor?.Code;
      var tutor = payment.Tutor ?? payment.LearningRequest?.Tutor;
      string? tutorName = tutor?.User?.FullName;
      string? tutorCode = tutor?.Code;

      return new PaymentAdminDto
      {
        Id = payment.Id,
        LearningRequestId = payment.LearningRequestId,
        PaidByUserId = payment.PaidByUserId,
        ClassId = payment.ClassId,
        TutorId = payment.TutorId ?? payment.LearningRequest?.TutorId,
        OrderCode = payment.OrderCode,
        Amount = payment.Amount,
        Description = payment.Description,
        Status = payment.Status,
        CheckoutUrl = payment.CheckoutUrl,
        TransactionId = payment.TransactionId,
        PaidAt = payment.PaidAt,
        CreatedAt = payment.CreatedAt,
        PaidByUserName = paidByUserName,
        PaidByUserCode = paidByUserCode,
        TutorName = tutorName,
        TutorCode = tutorCode
      };
    }
  }
}
