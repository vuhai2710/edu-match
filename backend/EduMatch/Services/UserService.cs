using AutoMapper;
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
    private readonly IMapper _mapper;

    public UserService(IUserRepository userRepository, IMapper mapper)
    {
      _userRepository = userRepository;
      _mapper = mapper;
    }

    public async Task<PagedResponse<UserDto>> GetUsersAsync(int pageNumber, int pageSize)
    {
      var (users, totalCount) = await _userRepository.GetUsersWithPaginationAsync(pageNumber, pageSize);

      return new PagedResponse<UserDto>
      {
        Items = _mapper.Map<List<UserDto>>(users),
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

      return _mapper.Map<UserDto>(user);
    }
  }
}
