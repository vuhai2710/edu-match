using System.Security.Claims;
using EduMatch.Common.Exception;
using EduMatch.Configurations;
using EduMatch.DTOs;
using EduMatch.DTOs.Chat;
using Microsoft.AspNetCore.Http;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Moq;

namespace EduMatch.Tests.Configurations;

public class ChatHubTests
{
  [Fact]
  public async Task SendMessage_EmitsOperationFailed_WhenBusinessExceptionOccurs()
  {
    var messageService = new Mock<IMessageService>();
    messageService
      .Setup(service => service.SaveMessageAsync(It.IsAny<long>(), It.IsAny<SendMessageDto>()))
      .ThrowsAsync(new ValidationException("Tin nhắn không hợp lệ.", "INVALID_MESSAGE"));

    var notificationService = new Mock<INotificationService>();
    var logger = new Mock<ILogger<ChatHub>>();

    var callerProxy = new Mock<ISingleClientProxy>();
    HubOperationErrorResponse? payload = null;

    callerProxy
      .Setup(proxy => proxy.SendCoreAsync("OperationFailed", It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
      .Callback<string, object?[], CancellationToken>((_, args, _) =>
      {
        payload = Assert.IsType<HubOperationErrorResponse>(args[0]);
      })
      .Returns(Task.CompletedTask);

    var clients = new Mock<IHubCallerClients>();
    clients.SetupGet(c => c.Caller).Returns(callerProxy.Object);

    var context = new Mock<HubCallerContext>();
    context.SetupGet(c => c.ConnectionId).Returns("conn-1");
    context.SetupGet(c => c.User).Returns(CreatePrincipal((ClaimTypes.NameIdentifier, "15")));

    var hub = new ChatHub(messageService.Object, notificationService.Object, logger.Object)
    {
      Clients = clients.Object,
      Context = context.Object
    };

    await hub.SendMessage(new SendMessageDto
    {
      ReceiverId = 99,
      Content = "hello"
    });

    Assert.NotNull(payload);
    Assert.Equal("SendMessage", payload.Operation);
    Assert.Equal(StatusCodes.Status400BadRequest, payload.StatusCode);
    Assert.Equal("INVALID_MESSAGE", payload.ErrorCode);
    Assert.Equal("Tin nhắn không hợp lệ.", payload.Message);
  }

  [Fact]
  public async Task MarkAsRead_EmitsOperationFailed_WhenUserClaimInvalid()
  {
    var messageService = new Mock<IMessageService>();
    var notificationService = new Mock<INotificationService>();
    var logger = new Mock<ILogger<ChatHub>>();

    var callerProxy = new Mock<ISingleClientProxy>();
    HubOperationErrorResponse? payload = null;

    callerProxy
      .Setup(proxy => proxy.SendCoreAsync("OperationFailed", It.IsAny<object?[]>(), It.IsAny<CancellationToken>()))
      .Callback<string, object?[], CancellationToken>((_, args, _) =>
      {
        payload = Assert.IsType<HubOperationErrorResponse>(args[0]);
      })
      .Returns(Task.CompletedTask);

    var clients = new Mock<IHubCallerClients>();
    clients.SetupGet(c => c.Caller).Returns(callerProxy.Object);

    var context = new Mock<HubCallerContext>();
    context.SetupGet(c => c.ConnectionId).Returns("conn-2");
    context.SetupGet(c => c.User).Returns(CreatePrincipal((ClaimTypes.NameIdentifier, "invalid")));

    var hub = new ChatHub(messageService.Object, notificationService.Object, logger.Object)
    {
      Clients = clients.Object,
      Context = context.Object
    };

    await hub.MarkAsRead(88);

    Assert.NotNull(payload);
    Assert.Equal("MarkAsRead", payload.Operation);
    Assert.Equal(StatusCodes.Status401Unauthorized, payload.StatusCode);
    Assert.Equal("UNAUTHORIZED", payload.ErrorCode);
  }

  private static ClaimsPrincipal CreatePrincipal(params (string Type, string Value)[] claims)
  {
    return new ClaimsPrincipal(
      new ClaimsIdentity(
        claims.Select(claim => new Claim(claim.Type, claim.Value)),
        "TestAuthType"));
  }
}
