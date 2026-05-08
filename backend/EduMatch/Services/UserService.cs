using AutoMapper;
using EduMatch.DTOs;
using EduMatch.DTOs.User;
using EduMatch.Enums;
using EduMatch.Exception;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace EduMatch.Services
{
  public class UserService : IUserService
  {
    private readonly IUserRepository _userRepository;
    private readonly IFileService _fileService;
    private readonly IMapper _mapper;

    public UserService(IUserRepository userRepository, IFileService fileService, IMapper mapper)
    {
      _userRepository = userRepository;
      _fileService = fileService;
      _mapper = mapper;
    }

    public async Task<PagedResult<UserDto>> GetUsersAsync(UserQueryParameters parameters)
    {
      var pagedUsers = await _userRepository.GetUsersWithPaginationAsync(parameters);

      return new PagedResult<UserDto>
      {
        Items = _mapper.Map<List<UserDto>>(pagedUsers.Items),
        TotalCount = pagedUsers.TotalCount,
        Page = pagedUsers.Page,
        PageSize = pagedUsers.PageSize,
        TotalPages = pagedUsers.TotalPages
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

    public async Task<bool> DeleteUserAsync(long id)
    {
      var user = await _userRepository.GetByIdAsync(id);

      if (user == null)
      {
        throw new AppException("Không tìm thấy người dùng", 404);
      }

      user.IsDeleted = true;
      
      _userRepository.Update(user);
      await _userRepository.SaveChangesAsync();

      return true;
    }

    public async Task<string> UpdateAvatarAsync(long userId, IFormFile file)
    {
      var user = await _userRepository.GetByIdAsync(userId);
      if (user == null)
      {
        throw new NotFoundException("Không tìm thấy người dùng");
      }

      var savedFile = await _fileService.UploadAvatarAsync(file);
      user.AvatarFileId = savedFile.Id;

      _userRepository.Update(user);
      await _userRepository.SaveChangesAsync();

      return savedFile.FilePath;
    }
  }
}
