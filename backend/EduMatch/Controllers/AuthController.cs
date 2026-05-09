using EduMatch.DTOs;
using EduMatch.DTOs.Auth;
using EduMatch.Services;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class AuthController : ControllerBase
  {
    private readonly AuthService _authService;
    private readonly IPasswordResetService _passwordResetService;

    public AuthController(AuthService authService, IPasswordResetService passwordResetService)
    {
      _authService = authService;
      _passwordResetService = passwordResetService;
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

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
    {
      await _passwordResetService.ForgotPasswordAsync(dto.Email);
      return Ok(ApiResponse.Ok("Nếu email tồn tại, link đặt lại mật khẩu đã được gửi."));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto dto)
    {
      await _passwordResetService.ResetPasswordAsync(dto.Token, dto.NewPassword);
      return Ok(ApiResponse.Ok("Đặt lại mật khẩu thành công."));
    }

    [HttpGet("validate-reset-token")]
    [AllowAnonymous]
    public async Task<IActionResult> ValidateResetToken([FromQuery] string token)
    {
      var isValid = await _passwordResetService.ValidateTokenAsync(token);
      return Ok(ApiResponse<ValidateResetTokenResponseDto>.SuccessResult(
        new ValidateResetTokenResponseDto { IsValid = isValid }));
    }
  }
}
