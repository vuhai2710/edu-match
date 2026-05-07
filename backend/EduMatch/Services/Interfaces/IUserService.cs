using EduMatch.DTOs;
using EduMatch.DTOs.User;

namespace EduMatch.Services.Interfaces
{
  public interface IUserService
  {
    Task<PagedResponse<UserDto>> GetUsersAsync(int pageNumber, int pageSize);
    Task<UserDto> GetUserByIdAsync(long id);
  }
}
