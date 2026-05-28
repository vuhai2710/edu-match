using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
using Microsoft.AspNetCore.Http;

namespace EduMatch.Services
{
  public interface ITutorService
  {
    Task<ApiResponse<PagedResult<TutorDto>>> GetTutorsAsync(TutorQueryParameters parameters);
    Task<ApiResponse<TutorDetailDto>> GetTutorByIdOrCodeAsync(string idOrCode);
    Task<ApiResponse<TutorDetailDto>> GetTutorByUserIdAsync(long userId);
    Task<ApiResponse<TutorDetailDto>> UpdateTutorProfileAsync(long userId, UpdateTutorDto dto);
    Task<ApiResponse<FileDto>> UpdateCvAsync(long userId, IFormFile file);
    Task<ApiResponse> DeleteCvAsync(long userId);
  }
}
