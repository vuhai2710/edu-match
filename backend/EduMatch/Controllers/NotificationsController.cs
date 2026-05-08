using System.Security.Claims;
using EduMatch.DTOs;
using EduMatch.DTOs.Notification;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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

        private long GetCurrentUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (long.TryParse(userIdStr, out var userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("User is not authenticated");
        }

        [HttpGet]
        public async Task<ActionResult<ApiResponse<List<NotificationDto>>>> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 10)
        {
            var userId = GetCurrentUserId();
            var notifications = await _notificationService.GetMyNotificationsAsync(userId, page, pageSize);

            return Ok(new ApiResponse<List<NotificationDto>>
            {
                Success = true,
                Data = notifications,
                Message = "Notifications retrieved successfully"
            });
        }

        [HttpGet("unread-count")]
        public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
        {
            var userId = GetCurrentUserId();
            var count = await _notificationService.GetUnreadCountAsync(userId);

            return Ok(new ApiResponse<int>
            {
                Success = true,
                Data = count,
                Message = "Unread count retrieved"
            });
        }

        [HttpPut("{id}/read")]
        public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(long id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _notificationService.MarkAsReadAsync(id, userId);

                return Ok(new ApiResponse<bool>
                {
                    Success = true,
                    Data = true,
                    Message = "Notification marked as read"
                });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new ApiResponse<bool>
                {
                    Success = false,
                    Message = ex.Message
                });
            }
        }
    }
}