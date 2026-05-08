using EduMatch.DTOs;
using EduMatch.DTOs.User;
using EduMatch.Exception;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class UsersController : ControllerBase
  {
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
      _userService = userService;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<PagedResult<UserDto>>>> GetUsers([FromQuery] UserQueryParameters parameters)
    {
      var result = await _userService.GetUsersAsync(parameters);
      return Ok(ApiResponse<PagedResult<UserDto>>.SuccessResult(result));
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetUserById(long id)
    {
      var result = await _userService.GetUserByIdAsync(id);
      return Ok(ApiResponse<UserDto>.SuccessResult(result));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteUser(long id)
    {
      var result = await _userService.DeleteUserAsync(id);
      return Ok(ApiResponse<bool>.SuccessResult(result, "Xóa người dùng thành công"));
    }

    [HttpPut("me/avatar")]
    [Authorize]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<ApiResponse<string>>> UpdateMyAvatar(IFormFile file)
    {
      var result = await _userService.UpdateAvatarAsync(GetCurrentUserId(), file);
      return Ok(ApiResponse<string>.SuccessResult(result, "Cập nhật ảnh đại diện thành công"));
    }

    [HttpDelete("me/avatar")]
    [Authorize]
    public async Task<ActionResult<ApiResponse>> DeleteMyAvatar()
    {
      await _userService.DeleteAvatarAsync(GetCurrentUserId());
      return Ok(ApiResponse.Ok("Xóa ảnh đại diện thành công"));
    }

    private long GetCurrentUserId()
    {
      var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
      if (!long.TryParse(userIdClaim, out var userId))
      {
        throw new AppException("Không thể xác thực người dùng", 401);
      }

      return userId;
    }
  }
}
