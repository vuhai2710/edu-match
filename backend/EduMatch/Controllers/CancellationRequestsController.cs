using EduMatch.Common.Enums;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.CancellationRequests;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/cancellation-requests")]
  [ApiController]
  public class CancellationRequestsController : ControllerBase
  {
    private readonly ICancellationRequestService _cancellationRequestService;

    public CancellationRequestsController(ICancellationRequestService cancellationRequestService)
    {
      _cancellationRequestService = cancellationRequestService;
    }

    [HttpPost]
    [Authorize(Roles = "Student,Tutor,Admin")]
    [SwaggerOperation(OperationId = "createCancellationRequest")]
    [ProducesResponseType(typeof(ApiResponse<CancellationRequestDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<CancellationRequestDto>>> Create([FromBody] CreateCancellationRequestDto dto)
    {
      var response = await _cancellationRequestService.CreateAsync(
        GetCurrentUserId(),
        GetCurrentUserRole(),
        dto);

      return this.CreatedResponse($"/api/admin/cancellation-requests/{response.Data?.Id}", response);
    }

    [HttpGet("me")]
    [Authorize(Roles = "Student,Tutor")]
    [SwaggerOperation(OperationId = "getMyCancellationRequests")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<CancellationRequestDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    public async Task<ActionResult<ApiResponse<PagedResult<CancellationRequestDto>>>> GetMine([FromQuery] CancellationRequestQueryParameters parameters)
    {
      return this.OkResponse(await _cancellationRequestService.GetMineAsync(
        GetCurrentUserId(),
        GetCurrentUserRole(),
        parameters));
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
}
