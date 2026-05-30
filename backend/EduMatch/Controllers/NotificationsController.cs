using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Notification;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/notifications")]
  [ApiController]
  [Authorize]
  public class NotificationsController : ControllerBase
  {
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
      _notificationService = notificationService;
    }

    [HttpGet]
    [SwaggerOperation(OperationId = "getNotifications")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<NotificationDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<PagedResult<NotificationDto>>>> GetNotifications([FromQuery] NotificationQueryParameters parameters)
    {
      var userId = GetCurrentUserId();
      var notifications = await _notificationService.GetMyNotificationsAsync(userId, parameters);

      return this.OkResponse(ApiResponse<PagedResult<NotificationDto>>.SuccessResult(
        notifications,
        "Notifications retrieved successfully"));
    }

    [HttpGet("unread-count")]
    [SwaggerOperation(OperationId = "getUnreadNotificationCount")]
    [ProducesResponseType(typeof(ApiResponse<int>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
    {
      var userId = GetCurrentUserId();
      var count = await _notificationService.GetUnreadCountAsync(userId);

      return this.OkResponse(ApiResponse<int>.SuccessResult(count, "Unread count retrieved"));
    }

    [HttpPut("{id:long}/read")]
    [SwaggerOperation(OperationId = "markNotificationAsRead")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(long id)
    {
      var userId = GetCurrentUserId();
      await _notificationService.MarkAsReadAsync(id, userId);

      return this.OkResponse(ApiResponse<bool>.SuccessResult(true, "Notification marked as read"));
    }

    [HttpPut("read-all")]
    [SwaggerOperation(OperationId = "markAllNotificationsAsRead")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAllAsRead()
    {
      var userId = GetCurrentUserId();
      var result = await _notificationService.MarkAllAsReadAsync(userId);

      return this.OkResponse(ApiResponse<bool>.SuccessResult(result, "All notifications marked as read"));
    }

    private long GetCurrentUserId()
    {
      return User.GetRequiredUserId();
    }
  }
}
