using System.Text.Json;
using EduMatch.Common.Exception;
using EduMatch.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;

namespace EduMatch.Tests.Common.Exception;

public class GlobalExceptionMiddlewareTests
{
  public static IEnumerable<object[]> ExceptionCases()
  {
    yield return
    [
      new ValidationException("Payload không hợp lệ.", "VALIDATION_ERROR"),
      StatusCodes.Status400BadRequest,
      "VALIDATION_ERROR"
    ];

    yield return
    [
      new UnauthorizedException("Phiên đăng nhập hết hạn."),
      StatusCodes.Status401Unauthorized,
      "UNAUTHORIZED"
    ];

    yield return
    [
      new ForbiddenException("Không có quyền.", "FORBIDDEN"),
      StatusCodes.Status403Forbidden,
      "FORBIDDEN"
    ];

    yield return
    [
      new NotFoundException("Không tìm thấy bản ghi.", "NOT_FOUND"),
      StatusCodes.Status404NotFound,
      "NOT_FOUND"
    ];

    yield return
    [
      new ConflictException("Dữ liệu bị xung đột.", "CONFLICT"),
      StatusCodes.Status409Conflict,
      "CONFLICT"
    ];

    yield return
    [
      new DataConsistencyException("Broken invariant.", "DATA_INTEGRITY_ERROR"),
      StatusCodes.Status500InternalServerError,
      "DATA_INTEGRITY_ERROR"
    ];
  }

  [Theory]
  [MemberData(nameof(ExceptionCases))]
  public async Task InvokeAsync_WritesStandardErrorResponse(
    System.Exception exception,
    int expectedStatusCode,
    string expectedErrorCode)
  {
    var middleware = new GlobalExceptionMiddleware(
      _ => throw exception,
      NullLogger<GlobalExceptionMiddleware>.Instance);

    var context = new DefaultHttpContext();
    context.Response.Body = new MemoryStream();

    await middleware.InvokeAsync(context);

    context.Response.Body.Position = 0;
    var response = await JsonSerializer.DeserializeAsync<ErrorResponse>(
      context.Response.Body,
      new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

    Assert.NotNull(response);
    Assert.False(response.Success);
    Assert.Equal(expectedStatusCode, context.Response.StatusCode);
    Assert.Equal(expectedStatusCode, response.StatusCode);
    Assert.Equal(expectedErrorCode, response.ErrorCode);
  }

  [Fact]
  public async Task InvokeAsync_WritesGenericPayload_ForUnhandledException()
  {
    var middleware = new GlobalExceptionMiddleware(
      _ => throw new System.Exception("Raw failure"),
      NullLogger<GlobalExceptionMiddleware>.Instance);

    var context = new DefaultHttpContext();
    context.Response.Body = new MemoryStream();

    await middleware.InvokeAsync(context);

    context.Response.Body.Position = 0;
    var response = await JsonSerializer.DeserializeAsync<ErrorResponse>(
      context.Response.Body,
      new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

    Assert.NotNull(response);
    Assert.Equal(StatusCodes.Status500InternalServerError, response.StatusCode);
    Assert.Equal("INTERNAL_SERVER_ERROR", response.ErrorCode);
    Assert.DoesNotContain("Raw failure", response.Message, StringComparison.Ordinal);
  }
}
