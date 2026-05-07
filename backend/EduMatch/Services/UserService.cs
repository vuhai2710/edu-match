using EduMatch.DTOs;
using EduMatch.DTOs.User;
using EduMatch.Exception;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
  public class UserService : IUserService
  {
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
      _userRepository = userRepository;
    }

    public async Task<PagedResponse<UserDto>> GetUsersAsync(int pageNumber, int pageSize)
    {
      var (users, totalCount) = await _userRepository.GetUsersWithPaginationAsync(pageNumber, pageSize);

      var userDtos = users.Select(MapToDto).ToList();

      return new PagedResponse<UserDto>
      {
        Items = userDtos,
        TotalCount = totalCount,
        PageNumber = pageNumber,
        PageSize = pageSize
      };
    }

    public async Task<UserDto> GetUserByIdAsync(long id)
    {
      var user = await _userRepository.GetByIdAsync(id);
      
      if (user == null)
      {
        throw new AppException("Không tìm thấy người dùng", 404);
      }

      return MapToDto(user);
    }

    private UserDto MapToDto(User user)
    {
      return new UserDto
      {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role,
        AvatarUrl = user.AvatarUrl,
        Gender = user.Gender,
        Status = user.Status,
        IsActive = user.IsActive
      };
    }
  }
}
