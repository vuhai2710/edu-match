using EduMatch.DTOs;
using EduMatch.DTOs.Subject;

namespace EduMatch.Services.Interfaces
{
  public interface ISubjectService
  {
    Task<List<SubjectListItemDto>> GetSubjectsAsync();
    Task<PagedResult<TutorCardDto>> GetTutorsBySubjectAsync(long subjectId, TutorBySubjectQueryParameters parameters);
    Task<SubjectResponseDto> GetSubjectByIdAsync(long id);
    Task<SubjectResponseDto> CreateSubjectAsync(SubjectDto dto);
    Task<SubjectResponseDto> UpdateSubjectAsync(long id, SubjectDto dto);
    Task DeleteSubjectAsync(long id);
  }
}
