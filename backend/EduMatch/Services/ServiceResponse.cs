using EduMatch.Common.Exception;
using EduMatch.DTOs;

namespace EduMatch.Services;

internal static class ServiceResponse
{
  public static async Task<ApiResponse<T>> ExecuteAsync<T>(Func<Task<ApiResponse<T>>> action)
  {
    try
    {
      return await action();
    }
    catch (System.Exception ex) when (TryMap(ex, out ApiResponse<T>? response))
    {
      return response;
    }
  }

  public static async Task<ApiResponse> ExecuteAsync(Func<Task<ApiResponse>> action)
  {
    try
    {
      return await action();
    }
    catch (System.Exception ex) when (TryMap(ex, out ApiResponse? response))
    {
      return response;
    }
  }

  private static bool TryMap<T>(System.Exception ex, out ApiResponse<T>? response)
  {
    if (TryMapCore(ex, out var statusCode, out var message))
    {
      response = ApiResponse<T>.Fail(message, statusCode);
      return true;
    }

    response = null;
    return false;
  }

  private static bool TryMap(System.Exception ex, out ApiResponse? response)
  {
    if (TryMapCore(ex, out var statusCode, out var message))
    {
      response = ApiResponse.Fail(message, statusCode);
      return true;
    }

    response = null;
    return false;
  }

  private static bool TryMapCore(System.Exception ex, out int statusCode, out string message)
  {
    switch (ex)
    {
      case UnauthorizedException unauthorizedException:
        statusCode = StatusCodes.Status401Unauthorized;
        message = unauthorizedException.Message;
        return true;
      case AppException appException when appException.StatusCode < StatusCodes.Status500InternalServerError:
        statusCode = appException.StatusCode;
        message = appException.Message;
        return true;
      default:
        statusCode = StatusCodes.Status500InternalServerError;
        message = string.Empty;
        return false;
    }
  }
}
