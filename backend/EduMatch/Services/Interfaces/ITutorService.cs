using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
using Microsoft.AspNetCore.Http;

namespace EduMatch.Services
{
  public interface ITutorService
  {
    Task<PagedResult<TutorDto>> GetTutorsAsync(TutorQueryParameters parameters);
    Task<TutorDetailDto> GetTutorByIdOrCodeAsync(string idOrCode);
    Task<TutorDetailDto> GetTutorByUserIdAsync(long userId);
    Task<TutorDetailDto> UpdateTutorProfileAsync(long userId, UpdateTutorDto dto);
    Task<FileDto> UpdateCvAsync(long userId, IFormFile file);
    Task DeleteCvAsync(long userId);
  }
}
