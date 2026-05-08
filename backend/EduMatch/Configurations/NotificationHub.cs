using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;

namespace EduMatch.Configuration
{
  public class NotificationHub : Hub
  {
    public override async Task OnConnectedAsync()
    {
      if (Context.User?.IsInRole("Admin") == true)
      {
        await Groups.AddToGroupAsync(Context.ConnectionId, "Admin");
      }

      var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!string.IsNullOrWhiteSpace(userId))
      {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user:{userId}");
      }

      await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(System.Exception? exception)
    {
      if (Context.User?.IsInRole("Admin") == true)
      {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, "Admin");
      }

      var userId = Context.User?.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!string.IsNullOrWhiteSpace(userId))
      {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user:{userId}");
      }

      await base.OnDisconnectedAsync(exception);
    }
  }
}
