using System.Security.Claims;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
using EduMatch.Common.Exception;
using EduMatch.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class TutorsController : ControllerBase
  {
    private readonly ITutorService _tutorService;

    public TutorsController(ITutorService tutorService)
    {
      _tutorService = tutorService;
    }

    [HttpGet]
    [SwaggerOperation(OperationId = "getTutors")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TutorDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<PagedResult<TutorDto>>>> GetTutors([FromQuery] TutorQueryParameters parameters)
    {
      var result = await _tutorService.GetTutorsAsync(parameters);
      return this.OkResponse(ApiResponse<PagedResult<TutorDto>>.SuccessResult(result));
    }

    [HttpGet("{id}")]
    [SwaggerOperation(OperationId = "getTutorById")]
    [ProducesResponseType(typeof(ApiResponse<TutorDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> GetTutorById(long id)
    {
      var result = await _tutorService.GetTutorByIdAsync(id);
      return this.OkResponse(ApiResponse<TutorDetailDto>.SuccessResult(result));
    }

    [HttpGet("me")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "getMyTutorProfile")]
    [ProducesResponseType(typeof(ApiResponse<TutorDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> GetCurrentTutorProfile()
    {
      var result = await _tutorService.GetTutorByUserIdAsync(GetCurrentUserId());
      return this.OkResponse(ApiResponse<TutorDetailDto>.SuccessResult(result));
    }

    [HttpPut("me")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "updateMyTutorProfile")]
    [ProducesResponseType(typeof(ApiResponse<TutorDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> UpdateCurrentTutorProfile([FromBody] UpdateTutorDto dto)
    {
      var result = await _tutorService.UpdateTutorProfileAsync(GetCurrentUserId(), dto);
      return this.OkResponse(ApiResponse<TutorDetailDto>.SuccessResult(result, "Tutor profile updated successfully"));
    }

    [HttpPut("me/cv")]
    [Authorize(Roles = "Tutor")]
    [Consumes("multipart/form-data")]
    [SwaggerOperation(OperationId = "updateMyCv")]
    [ProducesResponseType(typeof(ApiResponse<FileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<FileDto>>> UpdateMyCv(IFormFile file)
    {
      var result = await _tutorService.UpdateCvAsync(GetCurrentUserId(), file);
      return this.OkResponse(ApiResponse<FileDto>.SuccessResult(result, "Cập nhật CV thành công"));
    }

    [HttpDelete("me/cv")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "deleteMyCv")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse>> DeleteMyCv()
    {
      await _tutorService.DeleteCvAsync(GetCurrentUserId());
      return this.OkResponse(ApiResponse.Ok("Xóa CV thành công"));
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
