using EduMatch.DTOs;
using EduMatch.DTOs.Auth;
using EduMatch.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class AuthController : ControllerBase
  {
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
      _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
      var data = await _authService.RegisterAsync(dto);
      return Ok(ApiResponse<AuthResponseDto>.SuccessResult(data, "Đăng ký thành công"));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
      var data = await _authService.LoginAsync(dto);
      return Ok(ApiResponse<AuthResponseDto>.SuccessResult(data, "Đăng nhập thành công"));
    }

    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto dto)
    {
      var data = await _authService.GoogleLoginAsync(dto);
      return Ok(ApiResponse<GoogleAuthResponseDto>.SuccessResult(data, "Google login successful"));
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
    {
      var data = await _authService.RefreshTokenAsync(dto);
      return Ok(ApiResponse<AuthResponseDto>.SuccessResult(data, "Refresh token thành công"));
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me()
    {
      var userId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      var email = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value;
      var role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

      return Ok(ApiResponse<object>.SuccessResult(new { userId, email, role }));
    }
  }
}
