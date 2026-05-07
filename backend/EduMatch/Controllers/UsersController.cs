using EduMatch.DTOs;
using EduMatch.DTOs.User;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  [Authorize]
  public class UsersController : ControllerBase
  {
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
      _userService = userService;
    }

    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PagedResponse<UserDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<PagedResponse<UserDto>>>> GetUsers(
      [FromQuery] int pageNumber = 1,
      [FromQuery] int pageSize = 10)
    {
      var result = await _userService.GetUsersAsync(pageNumber, pageSize);
      return Ok(ApiResponse<PagedResponse<UserDto>>.SuccessResult(result));
    }

    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ApiResponse<UserDto>>> GetUserById(long id)
    {
      var result = await _userService.GetUserByIdAsync(id);
      return Ok(ApiResponse<UserDto>.SuccessResult(result));
    }
  }
}
