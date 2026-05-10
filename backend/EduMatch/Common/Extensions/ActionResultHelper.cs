using EduMatch.DTOs;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.Common.Extensions
{
  public static class ActionResultHelper
  {
    public static ActionResult<ApiResponse<T>> OkResponse<T>(this ControllerBase controller, ApiResponse<T> response)
      => controller.Ok(WithStatusCode(response, StatusCodes.Status200OK));

    public static ActionResult<ApiResponse<T>> CreatedAtRouteResponse<T>(
      this ControllerBase controller,
      string routeName,
      object routeValues,
      ApiResponse<T> response)
      => controller.CreatedAtRoute(routeName, routeValues, WithStatusCode(response, StatusCodes.Status201Created));

    public static ActionResult<ApiResponse<T>> CreatedResponse<T>(
      this ControllerBase controller,
      string location,
      ApiResponse<T> response)
      => controller.Created(location, WithStatusCode(response, StatusCodes.Status201Created));

    public static ActionResult<ApiResponse> OkResponse(this ControllerBase controller, ApiResponse response)
      => controller.Ok(WithStatusCode(response, StatusCodes.Status200OK));

    public static NoContentResult NoContentResponse(this ControllerBase controller) => controller.NoContent();

    private static TResponse WithStatusCode<TResponse>(TResponse response, int statusCode)
      where TResponse : ApiResponse
    {
      response.StatusCode = statusCode;
      return response;
    }
  }
}
