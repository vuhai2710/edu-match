using EduMatch.Common.Extensions;
using EduMatch.DTOs;
using EduMatch.DTOs.DepositPolicy;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;

namespace EduMatch.Controllers;

[Route("api/deposit-policy")]
[ApiController]
public class DepositPolicyController : ControllerBase
{
  private readonly IDepositPolicyService _depositPolicyService;

  public DepositPolicyController(IDepositPolicyService depositPolicyService)
  {
    _depositPolicyService = depositPolicyService;
  }

  [HttpGet("admin")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "getDepositPolicy")]
  [ProducesResponseType(typeof(ApiResponse<DepositPolicyDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  public async Task<ActionResult<ApiResponse<DepositPolicyDto>>> GetPolicy()
  {
    var result = await _depositPolicyService.GetPolicyAsync();
    return this.OkResponse(ApiResponse<DepositPolicyDto>.SuccessResult(result));
  }

  [HttpPut("admin")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "upsertDepositPolicy")]
  [ProducesResponseType(typeof(ApiResponse<DepositPolicyDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  public async Task<ActionResult<ApiResponse<DepositPolicyDto>>> UpsertPolicy([FromBody] UpsertDepositPolicyDto dto)
  {
    var result = await _depositPolicyService.UpsertPolicyAsync(dto);
    return this.OkResponse(ApiResponse<DepositPolicyDto>.SuccessResult(result));
  }

  [HttpGet("preview")]
  [Authorize]
  [SwaggerOperation(OperationId = "previewDeposit")]
  [ProducesResponseType(typeof(ApiResponse<DepositPreviewResponseDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  public async Task<ActionResult<ApiResponse<DepositPreviewResponseDto>>> PreviewDeposit([FromQuery] DepositPreviewRequestDto request)
  {
    var result = await _depositPolicyService.PreviewDepositAsync(request.HourlyRate, request.HoursPerSession);
    return this.OkResponse(ApiResponse<DepositPreviewResponseDto>.SuccessResult(result));
  }
}
