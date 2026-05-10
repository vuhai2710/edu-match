using EduMatch.Common.Exception;
using EduMatch.DTOs;
using EduMatch.DTOs.Auth;
using EduMatch.DTOs.User;
using EduMatch.Services;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers
{
  [ApiController]
  [Route("api/[controller]")]
  public class AuthController : ControllerBase
  {
    private readonly AuthService _authService;
    private readonly IPasswordResetService _passwordResetService;
    private readonly IUserService _userService;

    public AuthController(AuthService authService, IPasswordResetService passwordResetService, IUserService userService)
    {
      _authService = authService;
      _passwordResetService = passwordResetService;
      _userService = userService;
    }

    [HttpPost("register")]
    [SwaggerOperation(OperationId = "register")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
      var data = await _authService.RegisterAsync(dto);
      return Ok(ApiResponse<LoginResponseDto>.SuccessResult(data, "Đăng ký thành công"));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-login")]
    [SwaggerOperation(OperationId = "login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
      var data = await _authService.LoginAsync(dto);
      return Ok(ApiResponse<LoginResponseDto>.SuccessResult(data, "Đăng nhập thành công"));
    }

    [HttpPost("google")]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "googleLogin")]
    [ProducesResponseType(typeof(ApiResponse<GoogleAuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto dto)
    {
      var data = await _authService.GoogleLoginAsync(dto);
      return Ok(ApiResponse<GoogleAuthResponseDto>.SuccessResult(data, "Google login successful"));
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "refreshToken")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
    {
      var data = await _authService.RefreshTokenAsync(dto);
      return Ok(ApiResponse<LoginResponseDto>.SuccessResult(data, "Refresh token thanh cong"));
    }

    [HttpPost("logout")]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "logout")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Logout([FromBody] LogoutDto dto)
    {
      await _authService.LogoutAsync(dto);
      return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    [SwaggerOperation(OperationId = "getCurrentUser")]
    [ProducesResponseType(typeof(ApiResponse<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Me()
    {
      var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
      if (!long.TryParse(userIdClaim, out var userId))
      {
        throw new UnauthorizedException("Không thể xác thực người dùng");
      }

      var userDto = await _userService.GetUserByIdAsync(userId);
      return Ok(ApiResponse<UserDto>.SuccessResult(userDto));
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-forgot-password")]
    [SwaggerOperation(OperationId = "forgotPassword")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
    {
      await _passwordResetService.ForgotPasswordAsync(dto.Email);
      return Ok(ApiResponse.Ok("Link đặt lại mật khẩu đã được gửi"));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "resetPassword")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDto dto)
    {
      await _passwordResetService.ResetPasswordAsync(dto.Token, dto.NewPassword);
      return Ok(ApiResponse.Ok("Đặt lại mật khẩu thành công"));
    }

    [HttpGet("validate-reset-token")]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "validateResetToken")]
    [ProducesResponseType(typeof(ApiResponse<ValidateResetTokenResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ValidateResetToken([FromQuery] string token)
    {
      var isValid = await _passwordResetService.ValidateTokenAsync(token);
      return Ok(ApiResponse<ValidateResetTokenResponseDto>.SuccessResult(
        new ValidateResetTokenResponseDto { IsValid = isValid }));
    }
  }
}
