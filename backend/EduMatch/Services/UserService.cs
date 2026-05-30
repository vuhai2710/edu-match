using AutoMapper;
using EduMatch.Common.Exception;
using EduMatch.DTOs;
using EduMatch.DTOs.User;
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

    public async Task<ApiResponse<PagedResult<UserDto>>> GetUsersAsync(UserQueryParameters parameters)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var pagedUsers = await _userRepository.GetUsersWithPaginationAsync(parameters);

        return ApiResponse<PagedResult<UserDto>>.SuccessResult(new PagedResult<UserDto>
        {
          Items = _mapper.Map<List<UserDto>>(pagedUsers.Items),
          TotalCount = pagedUsers.TotalCount,
          Page = pagedUsers.Page,
          PageSize = pagedUsers.PageSize,
          TotalPages = pagedUsers.TotalPages
        });
      });
    }

    public async Task<ApiResponse<UserDto>> GetUserByIdAsync(long id)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
          throw new NotFoundException("Không tìm thấy người dùng.");
        }

        return ApiResponse<UserDto>.SuccessResult(_mapper.Map<UserDto>(user));
      });
    }

    public async Task<ApiResponse<bool>> DeleteUserAsync(long id)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
        {
          throw new NotFoundException("Không tìm thấy người dùng.");
        }

        user.IsDeleted = true;
        if (user.Tutor != null)
        {
          user.Tutor.IsDeleted = true;
        }
        if (user.Student != null)
        {
          user.Student.IsDeleted = true;
        }

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        return ApiResponse<bool>.SuccessResult(true);
      });
    }

    public async Task<ApiResponse> ChangePasswordAsync(long userId, ChangePasswordDto dto)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null || user.IsDeleted)
        {
          throw new NotFoundException("Không tìm thấy người dùng.");
        }

        if (user.IsGoogleAccount)
        {
          throw new ValidationException("Tài khoản Google không hỗ trợ đổi mật khẩu.");
        }

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, user.Password))
        {
          throw new ValidationException("Mật khẩu hiện tại không đúng.");
        }

        if (BCrypt.Net.BCrypt.Verify(dto.NewPassword, user.Password))
        {
          throw new ValidationException("Mật khẩu mới phải khác mật khẩu hiện tại.");
        }

        user.Password = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword, workFactor: 12);
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        return ApiResponse.Ok("Đổi mật khẩu thành công");
      });
    }

    public async Task<ApiResponse<string>> UpdateAvatarAsync(long userId, IFormFile file)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
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

        return ApiResponse<string>.SuccessResult(savedFile.FilePath, "Cập nhật ảnh đại diện thành công");
      });
    }

    public async Task<ApiResponse> DeleteAvatarAsync(long userId)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
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

        return ApiResponse.Ok("Xóa ảnh đại diện thành công");
      });
    }
  }
}
