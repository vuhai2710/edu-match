using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.DTOs.Chat;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;

namespace EduMatch.Configurations
{
  [Authorize]
  public class ChatHub : Hub
  {
    private static readonly Dictionary<long, HashSet<string>> _connections = new();
    private static readonly object _lock = new();

    private readonly IMessageService _messageService;
    private readonly INotificationService _notificationService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IMessageService messageService, INotificationService notificationService, ILogger<ChatHub> logger)
    {
      _messageService = messageService;
      _notificationService = notificationService;
      _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
      var userId = Context.User.TryGetLongClaim(System.Security.Claims.ClaimTypes.NameIdentifier);
      if (!userId.HasValue)
      {
        _logger.LogWarning("Rejecting chat hub connection {ConnectionId} because the user id claim is missing or invalid.", Context.ConnectionId);
        Context.Abort();
        return;
      }

      lock (_lock)
      {
        if (!_connections.ContainsKey(userId.Value))
        {
          _connections[userId.Value] = new HashSet<string>();
        }

        _connections[userId.Value].Add(Context.ConnectionId);
      }

      _logger.LogInformation("User {UserId} connected: {ConnId}", userId.Value, Context.ConnectionId);
      await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(System.Exception? exception)
    {
      var userId = Context.User.TryGetLongClaim(System.Security.Claims.ClaimTypes.NameIdentifier);
      if (userId.HasValue)
      {
        lock (_lock)
        {
          if (_connections.ContainsKey(userId.Value))
          {
            _connections[userId.Value].Remove(Context.ConnectionId);
            if (_connections[userId.Value].Count == 0)
            {
              _connections.Remove(userId.Value);
            }
          }
        }
      }

      await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(SendMessageDto dto)
    {
      await ExecuteOperationAsync(nameof(SendMessage), async () =>
      {
        var senderId = GetUserId();

        var message = await _messageService.SaveMessageAsync(senderId, dto);

        await DeliverToUser(dto.ReceiverId, "ReceiveMessage", message);
        await DeliverToUser(senderId, "ReceiveMessage", message);

        if (!IsOnline(dto.ReceiverId))
        {
          await _notificationService.SendAsync(
            dto.ReceiverId,
            "Tin nhắn mới",
            $"{message.SenderName} đã gửi tin nhắn cho bạn",
            NotificationType.NewMessage,
            "Message",
            message.Id,
            $"/chat/{senderId}");
        }
      });
    }

    public async Task MarkAsRead(long partnerId)
    {
      await ExecuteOperationAsync(nameof(MarkAsRead), async () =>
      {
        var userId = GetUserId();
        await _messageService.MarkAsReadAsync(userId, partnerId);

        await DeliverToUser(partnerId, "MessagesRead", new { ReadBy = userId });
      });
    }

    private async Task ExecuteOperationAsync(string operation, Func<Task> action)
    {
      try
      {
        await action();
      }
      catch (System.Exception exception)
      {
        await SendOperationFailedAsync(operation, exception);
      }
    }

    private async Task SendOperationFailedAsync(string operation, System.Exception exception)
    {
      var error = ExceptionMapper.Map(exception);
      var traceId = TryGetTraceId();

      if (error.StatusCode >= StatusCodes.Status500InternalServerError)
      {
        _logger.LogError(
          exception,
          "Chat hub operation {Operation} failed for connection {ConnectionId} with status {StatusCode}",
          operation,
          Context.ConnectionId,
          error.StatusCode);
      }
      else
      {
        _logger.LogWarning(
          exception,
          "Chat hub operation {Operation} failed for connection {ConnectionId} with status {StatusCode}",
          operation,
          Context.ConnectionId,
          error.StatusCode);
      }

      await Clients.Caller.SendAsync(
        "OperationFailed",
        HubOperationErrorResponse.Create(operation, error, traceId));
    }

    private string? TryGetTraceId()
    {
      try
      {
        return Context.GetHttpContext()?.TraceIdentifier;
      }
      catch (System.Exception)
      {
        return null;
      }
    }

    private async Task DeliverToUser(long userId, string method, object data)
    {
      HashSet<string>? connIds;
      lock (_lock)
      {
        _connections.TryGetValue(userId, out connIds);
      }

      if (connIds == null || connIds.Count == 0)
      {
        return;
      }

      foreach (var connId in connIds.ToList())
      {
        await Clients.Client(connId).SendAsync(method, data);
      }
    }

    private long GetUserId()
    {
      return Context.User.GetRequiredUserId();
    }

    public static bool IsOnline(long userId)
    {
      lock (_lock)
      {
        return _connections.ContainsKey(userId);
      }
    }
  }
}
