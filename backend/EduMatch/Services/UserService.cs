using AutoMapper;
using EduMatch.DTOs;
using EduMatch.DTOs.User;
using EduMatch.Common.Exception;
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
        throw new NotFoundException("Không tìm thấy người dùng.");
      }

      return _mapper.Map<UserDto>(user);
    }

    public async Task<bool> DeleteUserAsync(long id)
    {
      var user = await _userRepository.GetByIdAsync(id);

      if (user == null)
      {
        throw new NotFoundException("Không tìm thấy người dùng.");
      }

      user.IsDeleted = true;

      _userRepository.Update(user);
      await _userRepository.SaveChangesAsync();

      return true;
    }

    public async Task<string> UpdateAvatarAsync(long userId, IFormFile file)
    {
      var user = await _userRepository.GetByIdAsync(userId);
      if (user == null || user.IsDeleted)
      {
        throw new NotFoundException("Không tìm thấy người dùng.");
      }

      if (user.AvatarFileId.HasValue)
      {
        await _fileService.DeleteFileRecordAsync(user.AvatarFileId.Value);
      }

      var savedFile = await _fileService.UploadAvatarAsync(file);
      user.AvatarFileId = savedFile.Id;
      user.UpdatedAt = DateTime.UtcNow;

      _userRepository.Update(user);
      await _userRepository.SaveChangesAsync();

      return savedFile.FilePath;
    }

    public async Task DeleteAvatarAsync(long userId)
    {
      var user = await _userRepository.GetByIdAsync(userId);
      if (user == null || user.IsDeleted)
      {
        throw new NotFoundException("Không tìm thấy người dùng.");
      }

      if (!user.AvatarFileId.HasValue)
      {
        throw new ValidationException("Người dùng chưa có avatar.");
      }

      await _fileService.DeleteFileRecordAsync(user.AvatarFileId.Value);
      user.AvatarFileId = null;
      user.UpdatedAt = DateTime.UtcNow;

      _userRepository.Update(user);
      await _userRepository.SaveChangesAsync();
    }
  }
}
