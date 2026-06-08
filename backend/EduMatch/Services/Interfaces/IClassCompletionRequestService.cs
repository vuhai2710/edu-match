using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.DTOs.ClassCompletionRequests;

namespace EduMatch.Services.Interfaces;

public interface IClassCompletionRequestService
{
  Task<ApiResponse<ClassCompletionRequestDto>> CreateAsync(long currentUserId, UserRole role, CreateClassCompletionRequestDto dto);
  Task<ApiResponse<ClassCompletionRequestDto>> RespondAsync(long requestId, long currentUserId, UserRole role, RespondClassCompletionRequestDto dto);
  Task<ApiResponse<ClassCompletionRequestDto>> GetLatestByClassIdAsync(long classId, long currentUserId, UserRole role);
}
