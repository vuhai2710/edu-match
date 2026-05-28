using EduMatch.DTOs;
using EduMatch.DTOs.Subject;

namespace EduMatch.Services.Interfaces
{
  public interface ISubjectService
  {
    Task<ApiResponse<List<SubjectListItemDto>>> GetSubjectsAsync();
    Task<ApiResponse<PagedResult<TutorCardDto>>> GetTutorsBySubjectAsync(long subjectId, TutorBySubjectQueryParameters parameters);
    Task<ApiResponse<SubjectResponseDto>> GetSubjectByIdAsync(long id);
    Task<ApiResponse<SubjectResponseDto>> CreateSubjectAsync(SubjectDto dto);
    Task<ApiResponse<SubjectResponseDto>> UpdateSubjectAsync(long id, SubjectDto dto);
    Task<ApiResponse> DeleteSubjectAsync(long id);
  }
}
