namespace EduMatch.Common.Exception
{
  public static class ExceptionMapper
  {
    private const string DefaultUnauthorizedMessage = "Phiên đăng nhập hết hạn.";
    private const string DefaultForbiddenMessage = "Bạn không có quyền thực hiện thao tác này.";
    private const string DefaultValidationMessage = "Dữ liệu không hợp lệ.";
    private const string DefaultDataConsistencyMessage = "Dữ liệu nội bộ không nhất quán. Vui lòng thử lại sau.";
    private const string DefaultSystemErrorMessage = "Lỗi hệ thống, vui lòng thử lại.";

    public static ExceptionDescriptor Map(System.Exception exception)
    {
      return exception switch
      {
        ValidationException validationException => new(
          StatusCodes.Status400BadRequest,
          ResolveMessage(validationException.Message, DefaultValidationMessage),
          validationException.ErrorCode,
          validationException.Errors),

        ArgumentException argumentException => new(
          StatusCodes.Status400BadRequest,
          ResolveMessage(argumentException.Message, DefaultValidationMessage),
          "INVALID_ARGUMENT"),

        NotFoundException notFoundException => new(
          StatusCodes.Status404NotFound,
          ResolveMessage(notFoundException.Message, "Không tìm thấy dữ liệu."),
          notFoundException.ErrorCode),

        ConflictException conflictException => new(
          StatusCodes.Status409Conflict,
          ResolveMessage(conflictException.Message, "Dữ liệu bị xung đột."),
          conflictException.ErrorCode),

        ForbiddenException forbiddenException => new(
          StatusCodes.Status403Forbidden,
          ResolveMessage(forbiddenException.Message, DefaultForbiddenMessage),
          forbiddenException.ErrorCode),

        UnauthorizedException unauthorizedException => new(
          StatusCodes.Status401Unauthorized,
          ResolveMessage(unauthorizedException.Message, DefaultUnauthorizedMessage),
          "UNAUTHORIZED"),

        UnauthorizedAccessException unauthorizedAccessException => new(
          StatusCodes.Status401Unauthorized,
          ResolveMessage(unauthorizedAccessException.Message, DefaultUnauthorizedMessage),
          "UNAUTHORIZED"),

        DataConsistencyException dataConsistencyException => new(
          StatusCodes.Status500InternalServerError,
          DefaultDataConsistencyMessage,
          dataConsistencyException.ErrorCode),

        InvalidOperationException => new(
          StatusCodes.Status500InternalServerError,
          DefaultDataConsistencyMessage,
          "DATA_INTEGRITY_ERROR"),

        AppException appException => new(
          appException.StatusCode,
          ResolveMessage(appException.Message, DefaultSystemErrorMessage),
          appException.ErrorCode),

        _ => new(
          StatusCodes.Status500InternalServerError,
          DefaultSystemErrorMessage,
          "INTERNAL_SERVER_ERROR")
      };
    }

    private static string ResolveMessage(string? message, string fallbackMessage)
    {
      return string.IsNullOrWhiteSpace(message)
        ? fallbackMessage
        : message;
    }
  }
}
