using System.Security.Claims;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Applications;
using EduMatch.Common.Exception;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class ApplicationsController : ControllerBase
  {
    private readonly IApplicationService _applicationService;

    public ApplicationsController(IApplicationService applicationService)
    {
      _applicationService = applicationService;
    }

    [HttpPost("/api/tutor-requests/{requestId:long}/apply")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "applyToRequest")]
    [ProducesResponseType(typeof(ApiResponse<ApplicationResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<ApplicationResponseDto>>> Apply(long requestId, [FromBody] ApplyToRequestDto dto)
    {
      var response = await _applicationService.ApplyAsync(GetCurrentUserId(), requestId, dto);
      return this.CreatedAtRouteResponse("GetApplicationById", new { id = response.Data!.Id }, response);
    }

    [HttpGet("{id:long}", Name = "GetApplicationById")]
    [Authorize(Roles = "Admin,Student,Tutor")]
    [SwaggerOperation(OperationId = "getApplicationById")]
    [ProducesResponseType(typeof(ApiResponse<ApplicationResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<ApplicationResponseDto>>> GetById(long id)
    {
      var response = await _applicationService.GetByIdAsync(id, GetCurrentUserId(), User.IsInRole("Admin"));
      return this.OkResponse(response);
    }

    [HttpGet("/api/tutor-requests/{requestId:long}/applications")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "getApplicationsByRequest")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ApplicationResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PagedResult<ApplicationResponseDto>>>> GetByRequest(long requestId, [FromQuery] BaseQueryParameters parameters)
    {
      var response = await _applicationService.GetByRequestIdAsync(requestId, GetCurrentUserId(), parameters.Page, parameters.PageSize);
      return this.OkResponse(response);
    }

    [HttpGet("me")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "getMyApplications")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<ApplicationResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PagedResult<ApplicationResponseDto>>>> GetMyApplications([FromQuery] BaseQueryParameters parameters)
    {
      var response = await _applicationService.GetMyApplicationsAsync(GetCurrentUserId(), parameters.Page, parameters.PageSize);
      return this.OkResponse(response);
    }

    [HttpPut("{id:long}/student-confirm")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "studentConfirmApplication")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<bool>>> StudentConfirm(long id)
    {
      var response = await _applicationService.StudentConfirmAsync(id, GetCurrentUserId());
      return this.OkResponse(response);
    }

    [HttpPut("{id:long}/student-reject")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "studentRejectApplication")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<bool>>> StudentReject(long id)
    {
      var response = await _applicationService.StudentRejectAsync(id, GetCurrentUserId());
      return this.OkResponse(response);
    }

    [HttpPut("{id:long}/student-accept-match")]
    [Authorize(Roles = "Student")]
    [SwaggerOperation(OperationId = "studentAcceptMatch")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<bool>>> StudentAcceptMatch(long id)
    {
      var response = await _applicationService.StudentAcceptMatchAsync(id, GetCurrentUserId());
      return this.OkResponse(response);
    }

    [HttpPut("{id:long}/tutor-accept-match")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "tutorAcceptMatch")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<bool>>> TutorAcceptMatch(long id)
    {
      var response = await _applicationService.TutorAcceptMatchAsync(id, GetCurrentUserId());
      return this.OkResponse(response);
    }

    private long GetCurrentUserId()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!long.TryParse(userIdClaim, out var userId))
      {
        throw new UnauthorizedException("Không thể xác thực người dùng.");
      }

      return userId;
    }
  }
}
