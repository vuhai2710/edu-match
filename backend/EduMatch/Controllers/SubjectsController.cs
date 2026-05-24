using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.Subject;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class SubjectsController : ControllerBase
  {
    private readonly ISubjectService _subjectService;

    public SubjectsController(ISubjectService subjectService)
    {
      _subjectService = subjectService;
    }

    [HttpGet]
    [SwaggerOperation(OperationId = "getSubjects")]
    [ProducesResponseType(typeof(ApiResponse<List<SubjectListItemDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<SubjectListItemDto>>>> GetSubjects()
    {
      var result = await _subjectService.GetSubjectsAsync();
      return this.OkResponse(ApiResponse<List<SubjectListItemDto>>.SuccessResult(result));
    }

    [HttpGet("{id:long}/tutors")]
    [SwaggerOperation(OperationId = "getTutorsBySubject")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TutorCardDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PagedResult<TutorCardDto>>>> GetTutorsBySubject(
      long id,
      [FromQuery] TutorBySubjectQueryParameters parameters)
    {
      var result = await _subjectService.GetTutorsBySubjectAsync(id, parameters);
      return this.OkResponse(ApiResponse<PagedResult<TutorCardDto>>.SuccessResult(result));
    }

    [HttpGet("{id:long}")]
    [SwaggerOperation(OperationId = "getSubjectById")]
    [ProducesResponseType(typeof(ApiResponse<SubjectResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<SubjectResponseDto>>> GetSubjectById(long id)
    {
      var result = await _subjectService.GetSubjectByIdAsync(id);
      return this.OkResponse(ApiResponse<SubjectResponseDto>.SuccessResult(result));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [SwaggerOperation(OperationId = "createSubject")]
    [ProducesResponseType(typeof(ApiResponse<SubjectResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<SubjectResponseDto>>> CreateSubject([FromBody] SubjectDto dto)
    {
      var result = await _subjectService.CreateSubjectAsync(dto);
      return this.CreatedResponse($"/api/subjects/{result.Id}", ApiResponse<SubjectResponseDto>.SuccessResult(result));
    }

    [HttpPut("{id:long}")]
    [Authorize(Roles = "Admin")]
    [SwaggerOperation(OperationId = "updateSubject")]
    [ProducesResponseType(typeof(ApiResponse<SubjectResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<SubjectResponseDto>>> UpdateSubject(long id, [FromBody] SubjectDto dto)
    {
      var result = await _subjectService.UpdateSubjectAsync(id, dto);
      return this.OkResponse(ApiResponse<SubjectResponseDto>.SuccessResult(result));
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "Admin")]
    [SwaggerOperation(OperationId = "deleteSubject")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteSubject(long id)
    {
      await _subjectService.DeleteSubjectAsync(id);
      return this.OkResponse(ApiResponse<bool>.SuccessResult(true));
    }
  }
}
