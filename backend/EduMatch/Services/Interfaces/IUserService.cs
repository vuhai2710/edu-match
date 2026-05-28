using EduMatch.DTOs;
using EduMatch.DTOs.User;
using Microsoft.AspNetCore.Http;

namespace EduMatch.Services.Interfaces
{
  public interface IUserService
  {
    Task<ApiResponse<PagedResult<UserDto>>> GetUsersAsync(UserQueryParameters parameters);
    Task<ApiResponse<UserDto>> GetUserByIdAsync(long id);
    Task<ApiResponse<bool>> DeleteUserAsync(long id);
    Task<ApiResponse> ChangePasswordAsync(long userId, ChangePasswordDto dto);
    Task<ApiResponse<string>> UpdateAvatarAsync(long userId, IFormFile file);
    Task<ApiResponse> DeleteAvatarAsync(long userId);
  }
}
