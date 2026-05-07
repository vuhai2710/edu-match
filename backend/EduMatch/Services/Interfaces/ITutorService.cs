using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;

namespace EduMatch.Services
{
  public interface ITutorService
  {
    Task<PagedResponse<TutorDto>> GetTutorsAsync(int pageNumber, int pageSize, int? provinceId = null, string? wardCode = null);
    Task<TutorDetailDto> GetTutorByIdAsync(long id);
    Task<TutorDetailDto> GetTutorByUserIdAsync(long userId);
    Task<TutorDetailDto> UpdateTutorProfileAsync(long userId, UpdateTutorDto dto);
  }
}
