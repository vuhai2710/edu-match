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
      return this.OkResponse(await _subjectService.GetSubjectsAsync());
    }

    [HttpGet("{id:long}/tutors")]
    [SwaggerOperation(OperationId = "getTutorsBySubject")]
    [ProducesResponseType(typeof(ApiResponse<PagedResult<TutorCardDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<PagedResult<TutorCardDto>>>> GetTutorsBySubject(
      long id,
      [FromQuery] TutorBySubjectQueryParameters parameters)
    {
      return this.OkResponse(await _subjectService.GetTutorsBySubjectAsync(id, parameters));
    }

    [HttpGet("{id:long}")]
    [SwaggerOperation(OperationId = "getSubjectById")]
    [ProducesResponseType(typeof(ApiResponse<SubjectResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<SubjectResponseDto>>> GetSubjectById(long id)
    {
      return this.OkResponse(await _subjectService.GetSubjectByIdAsync(id));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    [SwaggerOperation(OperationId = "createSubject")]
    [ProducesResponseType(typeof(ApiResponse<SubjectResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<SubjectResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<ApiResponse<SubjectResponseDto>>> CreateSubject([FromBody] SubjectDto dto)
    {
      var result = await _subjectService.CreateSubjectAsync(dto);
      if (!result.Success)
      {
        return this.OkResponse(result);
      }

      return this.CreatedResponse($"/api/subjects/{result.Data!.Id}", result);
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
      return this.OkResponse(await _subjectService.UpdateSubjectAsync(id, dto));
    }

    [HttpDelete("{id:long}")]
    [Authorize(Roles = "Admin")]
    [SwaggerOperation(OperationId = "deleteSubject")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse>> DeleteSubject(long id)
    {
      return this.OkResponse(await _subjectService.DeleteSubjectAsync(id));
    }
  }
}
