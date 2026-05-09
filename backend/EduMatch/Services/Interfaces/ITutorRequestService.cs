using EduMatch.DTOs;
using EduMatch.DTOs.TutorRequests;

namespace EduMatch.Services.Interfaces
{
  public interface ITutorRequestService
  {
    Task<ApiResponse<TutorRequestResponseDto>> CreateAsync(long studentId, CreateTutorRequestDto dto);
    Task<ApiResponse<PagedResult<TutorRequestResponseDto>>> GetAllAsync(TutorRequestFilterDto filter);
    Task<ApiResponse<PagedResult<TutorRequestResponseDto>>> GetMyRequestsAsync(long studentId, int page, int pageSize);
    Task<ApiResponse<TutorRequestResponseDto>> GetByIdAsync(long id);
    Task<ApiResponse<bool>> CloseAsync(long id, long studentId);
    Task<ApiResponse<TutorRequestResponseDto>> UpdateAsync(long id, long studentId, UpdateTutorRequestDto dto);
  }
}
