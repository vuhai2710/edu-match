using EduMatch.Common.Enums;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.ClassCompletionRequests;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers;

[Route("api/class-completion-requests")]
[ApiController]
public class ClassCompletionRequestsController : ControllerBase
{
  private readonly IClassCompletionRequestService _classCompletionRequestService;

  public ClassCompletionRequestsController(IClassCompletionRequestService classCompletionRequestService)
  {
    _classCompletionRequestService = classCompletionRequestService;
  }

  [HttpPost]
  [Authorize(Roles = "Student,Tutor")]
  [SwaggerOperation(OperationId = "createClassCompletionRequest")]
  [ProducesResponseType(typeof(ApiResponse<ClassCompletionRequestDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ApiResponse<ClassCompletionRequestDto>), StatusCodes.Status201Created)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
  public async Task<ActionResult<ApiResponse<ClassCompletionRequestDto>>> Create([FromBody] CreateClassCompletionRequestDto dto)
  {
    var response = await _classCompletionRequestService.CreateAsync(
      GetCurrentUserId(),
      GetCurrentUserRole(),
      dto);

    if (!response.Success)
    {
      return this.OkResponse(response);
    }

    return this.CreatedResponse($"/api/class-completion-requests/{response.Data?.Id}", response);
  }

  [HttpPut("{id:long}/respond")]
  [Authorize(Roles = "Student,Tutor")]
  [SwaggerOperation(OperationId = "respondClassCompletionRequest")]
  [ProducesResponseType(typeof(ApiResponse<ClassCompletionRequestDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
  public async Task<ActionResult<ApiResponse<ClassCompletionRequestDto>>> Respond(long id, [FromBody] RespondClassCompletionRequestDto dto)
  {
    return this.OkResponse(await _classCompletionRequestService.RespondAsync(
      id,
      GetCurrentUserId(),
      GetCurrentUserRole(),
      dto));
  }

  private long GetCurrentUserId()
  {
    return User.GetRequiredUserId();
  }

  private UserRole GetCurrentUserRole()
  {
    return User.GetRequiredUserRole();
  }
}
