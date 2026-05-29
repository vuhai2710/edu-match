using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Applications;
using EduMatch.DTOs.CancellationRequests;
using EduMatch.DTOs.Classes;
using EduMatch.DTOs.Payment;
using EduMatch.DTOs.TutorRequests;
using EduMatch.Services.Interfaces;
using EduMatch.Repositories;
using EduMatch.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  [Authorize(Roles = "Admin")]
  public class AdminController : ControllerBase
  {
    private readonly IApplicationService _applicationService;
    private readonly ITutorRequestService _tutorRequestService;
    private readonly IPaymentService _paymentService;
    private readonly IClassReadService _classReadService;
    private readonly ICancellationRequestService _cancellationRequestService;
    private readonly ITutorRepository _tutorRepository;
    private readonly INotificationService _notificationService;

    public AdminController(
      IApplicationService applicationService,
      ITutorRequestService tutorRequestService,
      IPaymentService paymentService,
      IClassReadService classReadService,
      ICancellationRequestService cancellationRequestService,
      ITutorRepository tutorRepository,
      INotificationService notificationService)
    {
      _applicationService = applicationService;
      _tutorRequestService = tutorRequestService;
      _paymentService = paymentService;
      _classReadService = classReadService;
      _cancellationRequestService = cancellationRequestService;
      _tutorRepository = tutorRepository;
      _notificationService = notificationService;
    }

    [HttpGet("applications")]
    [SwaggerOperation(OperationId = "getAllApplicationsForAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ApplicationResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<ApplicationResponseDto>>>> GetAllApplications([FromQuery] ApplicationQueryParameters parameters)
    {
      return this.OkResponse(await _applicationService.GetAllForAdminAsync(parameters));
    }

    [HttpGet("tutor-requests")]
    [SwaggerOperation(OperationId = "getAllRequestsForAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TutorRequestResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<TutorRequestResponseDto>>>> GetAllRequests([FromQuery] TutorRequestFilterDto filter)
    {
      return this.OkResponse(await _tutorRequestService.GetAllAsync(filter));
    }

    [HttpGet("payments")]
    [SwaggerOperation(OperationId = "getAllPayments")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<PaymentAdminDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<PaymentAdminDto>>>> GetAllPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] PaymentStatus? status = null)
    {
      return this.OkResponse(ApiResponse<PagedResult<PaymentAdminDto>>.SuccessResult(await _paymentService.GetPagedAsync(page, pageSize, status)));
    }

    [HttpGet("payments/{id:long}")]
    [SwaggerOperation(OperationId = "getPaymentById")]
    [ProducesResponseType(typeof(ApiResponse<PaymentAdminDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PaymentAdminDto>>> GetPaymentById(long id)
    {
      var payment = await _paymentService.GetByIdAsync(id);
      if (payment == null)
      {
        throw new NotFoundException("Payment not found", "PAYMENT_NOT_FOUND");
      }

      return this.OkResponse(ApiResponse<PaymentAdminDto>.SuccessResult(payment));
    }

    [HttpGet("classes")]
    [SwaggerOperation(OperationId = "getAllClasses")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ClassDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<ClassDto>>>> GetAllClasses([FromQuery] ClassQueryParameters parameters)
    {
      return this.OkResponse(await _classReadService.GetAdminClassesAsync(parameters));
    }

    [HttpGet("classes/{id:long}")]
    [SwaggerOperation(OperationId = "getClassByIdForAdmin")]
    [ProducesResponseType(typeof(ApiResponse<ClassDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ClassDto>>> GetClassById(long id)
    {
      return this.OkResponse(await _classReadService.GetByIdAsync(id, 0, true));
    }

    [HttpGet("cancellation-requests")]
    [SwaggerOperation(OperationId = "getAllCancellationRequestsForAdmin")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CancellationRequestDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<CancellationRequestDto>>>> GetAllCancellationRequests([FromQuery] CancellationRequestQueryParameters parameters)
    {
      return this.OkResponse(await _cancellationRequestService.GetAllForAdminAsync(parameters));
    }

    [HttpGet("cancellation-requests/{id:long}")]
    [SwaggerOperation(OperationId = "getCancellationRequestByIdForAdmin")]
    [ProducesResponseType(typeof(ApiResponse<CancellationRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<CancellationRequestDto>>> GetCancellationRequestById(long id)
    {
      return this.OkResponse(await _cancellationRequestService.GetByIdAsync(id));
    }

    [HttpPut("cancellation-requests/{id:long}/resolve")]
    [SwaggerOperation(OperationId = "resolveCancellationRequest")]
    [ProducesResponseType(typeof(ApiResponse<CancellationRequestDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<CancellationRequestDto>>> ResolveCancellationRequest(long id, [FromBody] ResolveCancellationRequestDto dto)
    {
      return this.OkResponse(await _cancellationRequestService.ResolveAsync(id, GetCurrentUserId(), dto));
    }

    [HttpPut("tutors/{id:long}/approve")]
    [SwaggerOperation(OperationId = "approveTutor")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> ApproveTutor(long id)
    {
      var tutor = await _tutorRepository.GetTutorProfileDetailAsync(id);
      if (tutor == null || tutor.IsDeleted)
      {
        throw new NotFoundException("Gia sư không tồn tại.");
      }

      tutor.ApprovalStatus = TutorApprovalStatus.Approved;
      tutor.UpdatedAt = DateTime.UtcNow;

      if (tutor.User != null && tutor.User.Role != UserRole.Tutor)
      {
        tutor.User.Role = UserRole.Tutor;
        tutor.User.UpdatedAt = DateTime.UtcNow;
      }

      _tutorRepository.Update(tutor);
      await _tutorRepository.SaveChangesAsync();

      if (tutor.User != null)
      {
        await _notificationService.SendAsync(
          tutor.User.Id,
          "Hồ sơ đã được phê duyệt",
          "Chúc mừng! Hồ sơ đăng ký gia sư của bạn đã được quản trị viên phê duyệt. Bạn đã có thể sử dụng đầy đủ các tính năng của hệ thống.",
          NotificationType.TutorApproved,
          "Tutor",
          tutor.Id,
          null);
      }

      return this.OkResponse(ApiResponse<bool>.SuccessResult(true, "Phê duyệt gia sư thành công."));
    }

    [HttpPut("tutors/{id:long}/reject")]
    [SwaggerOperation(OperationId = "rejectTutor")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> RejectTutor(long id)
    {
      var tutor = await _tutorRepository.GetByIdAsync(id);
      if (tutor == null || tutor.IsDeleted)
      {
        throw new NotFoundException("Gia sư không tồn tại.");
      }

      tutor.ApprovalStatus = TutorApprovalStatus.Rejected;
      tutor.UpdatedAt = DateTime.UtcNow;
      _tutorRepository.Update(tutor);
      await _tutorRepository.SaveChangesAsync();

      if (tutor.UserId != 0)
      {
        await _notificationService.SendAsync(
          tutor.UserId,
          "Hồ sơ không được phê duyệt",
          "Rất tiếc, hồ sơ đăng ký gia sư của bạn đã bị từ chối. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.",
          NotificationType.TutorRejected,
          "Tutor",
          tutor.Id,
          null);
      }

      return this.OkResponse(ApiResponse<bool>.SuccessResult(true, "Từ chối duyệt gia sư thành công."));
    }

    private long GetCurrentUserId()
    {
      return User.GetRequiredUserId();
    }
  }
}
