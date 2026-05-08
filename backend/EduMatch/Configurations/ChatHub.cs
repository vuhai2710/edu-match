using EduMatch.DTOs.Chat;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EduMatch.Configurations
{
  [Authorize]
  public class ChatHub : Hub
  {
    private static readonly Dictionary<long, HashSet<string>> _connections = new();
    private static readonly object _lock = new();

    private readonly IMessageService _messageService;
    private readonly ILogger<ChatHub> _logger;

    public ChatHub(IMessageService messageService, ILogger<ChatHub> logger)
    {
      _messageService = messageService;
      _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
      var userId = GetUserId();
      lock (_lock)
      {
        if (!_connections.ContainsKey(userId))
          _connections[userId] = new HashSet<string>();
        _connections[userId].Add(Context.ConnectionId);
      }
      _logger.LogInformation("User {UserId} connected: {ConnId}", userId, Context.ConnectionId);
      await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(System.Exception? exception)
    {
      var userId = GetUserId();
      lock (_lock)
      {
        if (_connections.ContainsKey(userId))
        {
          _connections[userId].Remove(Context.ConnectionId);
          if (_connections[userId].Count == 0)
            _connections.Remove(userId);
        }
      }
      await base.OnDisconnectedAsync(exception);
    }

    public async Task SendMessage(SendMessageDto dto)
    {
      var senderId = GetUserId();

      var message = await _messageService.SaveMessageAsync(senderId, dto);

      await DeliverToUser(dto.ReceiverId, "ReceiveMessage", message);

      await DeliverToUser(senderId, "ReceiveMessage", message);
    }

    public async Task MarkAsRead(long partnerId)
    {
      var userId = GetUserId();
      await _messageService.MarkAsReadAsync(userId, partnerId);

      await DeliverToUser(partnerId, "MessagesRead", new { ReadBy = userId });
    }

    private async Task DeliverToUser(long userId, string method, object data)
    {
      HashSet<string>? connIds;
      lock (_lock)
      {
        _connections.TryGetValue(userId, out connIds);
      }

      if (connIds == null || connIds.Count == 0) return;

      foreach (var connId in connIds.ToList())
      {
        await Clients.Client(connId).SendAsync(method, data);
      }
    }

    private long GetUserId()
    {
      var claim = Context.User?.FindFirst("userId")?.Value
                  ?? throw new HubException("Unauthorized");
      return long.Parse(claim);
    }

    public static bool IsOnline(long userId)
    {
      lock (_lock) { return _connections.ContainsKey(userId); }
    }
  }
}
