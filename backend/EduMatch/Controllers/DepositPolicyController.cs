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

  [HttpGet("admin/current")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "getCurrentDepositPolicy")]
  [ProducesResponseType(typeof(ApiResponse<DepositPolicyDto?>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  public async Task<ActionResult<ApiResponse<DepositPolicyDto?>>> GetCurrentPolicy()
  {
    return Ok(await _depositPolicyService.GetCurrentActivePolicyAsync());
  }

  [HttpGet("admin/history")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "getDepositPolicyHistory")]
  [ProducesResponseType(typeof(ApiResponse<PagedResult<DepositPolicyDto>>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  public async Task<ActionResult<ApiResponse<PagedResult<DepositPolicyDto>>>> GetHistory(
    [FromQuery] int page = 1,
    [FromQuery] int pageSize = 10)
  {
    return Ok(await _depositPolicyService.GetHistoryAsync(page, pageSize));
  }

  [HttpGet("admin/{id:long}")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "getDepositPolicyById")]
  [ProducesResponseType(typeof(ApiResponse<DepositPolicyDto?>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  public async Task<ActionResult<ApiResponse<DepositPolicyDto?>>> GetById(long id)
  {
    return Ok(await _depositPolicyService.GetPolicyByIdAsync(id));
  }

  [HttpPost("admin")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "createDepositPolicy")]
  [ProducesResponseType(typeof(ApiResponse<DepositPolicyDto?>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  public async Task<ActionResult<ApiResponse<DepositPolicyDto?>>> CreatePolicy([FromBody] UpsertDepositPolicyDto dto)
  {
    return Ok(await _depositPolicyService.CreatePolicyAsync(dto));
  }

  [HttpPut("admin/{id:long}")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "updateDepositPolicy")]
  [ProducesResponseType(typeof(ApiResponse<DepositPolicyDto?>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  public async Task<ActionResult<ApiResponse<DepositPolicyDto?>>> UpdatePolicy(long id, [FromBody] UpsertDepositPolicyDto dto)
  {
    return Ok(await _depositPolicyService.UpdatePolicyAsync(id, dto));
  }

  [HttpDelete("admin/{id:long}")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "deleteDepositPolicy")]
  [ProducesResponseType(typeof(ApiResponse), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  public async Task<ActionResult<ApiResponse>> DeletePolicy(long id)
  {
    return Ok(await _depositPolicyService.DeletePolicyAsync(id));
  }

  [HttpGet("preview")]
  [Authorize]
  [SwaggerOperation(OperationId = "previewDeposit")]
  [ProducesResponseType(typeof(ApiResponse<DepositPreviewResponseDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  public async Task<ActionResult<ApiResponse<DepositPreviewResponseDto>>> PreviewDeposit([FromQuery] DepositPreviewRequestDto request)
  {
    return Ok(await _depositPolicyService.PreviewDepositAsync(request.HourlyRate, request.HoursPerSession));
  }
}
