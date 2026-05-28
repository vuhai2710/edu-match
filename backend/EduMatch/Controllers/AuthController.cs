using EduMatch.Common.Exception;
using EduMatch.Common.Extensions;
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

    [HttpPost("register/student")]
    [Consumes("multipart/form-data")]
    [SwaggerOperation(OperationId = "registerStudent")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterStudent([FromForm] RegisterStudentDto dto)
    {
      return Ok(await _authService.RegisterStudentResponseAsync(dto));
    }

    [HttpPost("register/tutor")]
    [Consumes("multipart/form-data")]
    [SwaggerOperation(OperationId = "registerTutor")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterTutor([FromForm] RegisterTutorDto dto)
    {
      return Ok(await _authService.RegisterTutorResponseAsync(dto));
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
      return Ok(await _authService.LoginResponseAsync(dto));
    }

    [HttpPost("google")]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "googleLogin")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto dto)
    {
      return Ok(await _authService.GoogleLoginResponseAsync(dto));
    }

    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "refreshToken")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenDto dto)
    {
      return Ok(await _authService.RefreshTokenResponseAsync(dto));
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
    public async Task<ActionResult<ApiResponse<UserDto>>> Me()
    {
      return this.OkResponse(await _userService.GetUserByIdAsync(User.GetRequiredUserId()));
    }

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [EnableRateLimiting("auth-forgot-password")]
    [SwaggerOperation(OperationId = "forgotPassword")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse>> ForgotPassword([FromBody] ForgotPasswordRequestDto dto)
    {
      return this.OkResponse(await _passwordResetService.ForgotPasswordAsync(dto.Email));
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "resetPassword")]
    [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse>> ResetPassword([FromBody] ResetPasswordRequestDto dto)
    {
      return this.OkResponse(await _passwordResetService.ResetPasswordAsync(dto.Token, dto.NewPassword));
    }

    [HttpGet("validate-reset-token")]
    [AllowAnonymous]
    [SwaggerOperation(OperationId = "validateResetToken")]
    [ProducesResponseType(typeof(ApiResponse<ValidateResetTokenResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiResponse<ValidateResetTokenResponseDto>>> ValidateResetToken([FromQuery] string token)
    {
      var result = await _passwordResetService.ValidateTokenAsync(token);
      if (!result.Success)
      {
        return this.OkResponse(ApiResponse<ValidateResetTokenResponseDto>.Fail(result.Message, result.StatusCode));
      }

      return this.OkResponse(ApiResponse<ValidateResetTokenResponseDto>.SuccessResult(
        new ValidateResetTokenResponseDto { IsValid = result.Data },
        result.Message,
        result.StatusCode));
    }
  }
}
