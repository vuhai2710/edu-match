using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
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
      return this.OkResponse(await _tutorService.GetTutorsAsync(parameters));
    }

    [HttpGet("{idOrCode}")]
    [SwaggerOperation(OperationId = "getTutorById")]
    [ProducesResponseType(typeof(ApiResponse<TutorDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> GetTutorById(string idOrCode)
    {
      return this.OkResponse(await _tutorService.GetTutorByIdOrCodeAsync(idOrCode));
    }

    [HttpGet("me")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "getMyTutorProfile")]
    [ProducesResponseType(typeof(ApiResponse<TutorDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> GetCurrentTutorProfile()
    {
      return this.OkResponse(await _tutorService.GetTutorByUserIdAsync(GetCurrentUserId()));
    }

    [HttpPut("me")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "updateMyTutorProfile")]
    [ProducesResponseType(typeof(ApiResponse<TutorDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<TutorDetailDto>>> UpdateCurrentTutorProfile([FromBody] UpdateTutorDto dto)
    {
      return this.OkResponse(await _tutorService.UpdateTutorProfileAsync(GetCurrentUserId(), dto));
    }

    [HttpPut("me/cv")]
    [Authorize(Roles = "Tutor")]
    [Consumes("multipart/form-data")]
    [SwaggerOperation(OperationId = "updateMyCv")]
    [ProducesResponseType(typeof(ApiResponse<FileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<FileDto>>> UpdateMyCv(IFormFile file)
    {
      return this.OkResponse(await _tutorService.UpdateCvAsync(GetCurrentUserId(), file));
    }

    [HttpDelete("me/cv")]
    [Authorize(Roles = "Tutor")]
    [SwaggerOperation(OperationId = "deleteMyCv")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse>> DeleteMyCv()
    {
      return this.OkResponse(await _tutorService.DeleteCvAsync(GetCurrentUserId()));
    }

    private long GetCurrentUserId()
    {
      return User.GetRequiredUserId();
    }
  }
}
