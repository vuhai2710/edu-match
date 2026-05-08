using EduMatch.DTOs;
using EduMatch.DTOs.User;
using Microsoft.AspNetCore.Http;

namespace EduMatch.Services.Interfaces
{
  public interface IUserService
  {
    Task<PagedResult<UserDto>> GetUsersAsync(UserQueryParameters parameters);
    Task<UserDto> GetUserByIdAsync(long id);
    Task<bool> DeleteUserAsync(long id);
    Task<string> UpdateAvatarAsync(long userId, IFormFile file);
  }
}
