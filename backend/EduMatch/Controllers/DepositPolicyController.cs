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

  [HttpGet("admin/current")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "getCurrentDepositPolicy")]
  [ProducesResponseType(typeof(ApiResponse<DepositPolicyDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  public async Task<ActionResult<ApiResponse<DepositPolicyDto>>> GetCurrentPolicy()
  {
    var result = await _depositPolicyService.GetCurrentActivePolicyAsync();
    return this.OkResponse(ApiResponse<DepositPolicyDto>.SuccessResult(result));
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
    var result = await _depositPolicyService.GetHistoryAsync(page, pageSize);
    return this.OkResponse(ApiResponse<PagedResult<DepositPolicyDto>>.SuccessResult(result));
  }

  [HttpGet("admin/{id:long}")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "getDepositPolicyById")]
  [ProducesResponseType(typeof(ApiResponse<DepositPolicyDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  public async Task<ActionResult<ApiResponse<DepositPolicyDto>>> GetById(long id)
  {
    var result = await _depositPolicyService.GetPolicyByIdAsync(id);
    return this.OkResponse(ApiResponse<DepositPolicyDto>.SuccessResult(result));
  }

  [HttpPost("admin")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "createDepositPolicy")]
  [ProducesResponseType(typeof(ApiResponse<DepositPolicyDto>), StatusCodes.Status201Created)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
  public async Task<ActionResult<ApiResponse<DepositPolicyDto>>> CreatePolicy([FromBody] UpsertDepositPolicyDto dto)
  {
    var result = await _depositPolicyService.CreatePolicyAsync(dto);
    return this.OkResponse(ApiResponse<DepositPolicyDto>.SuccessResult(result, "Tao chinh sach dat coc thanh cong."));
  }

  [HttpPut("admin/{id:long}")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "updateDepositPolicy")]
  [ProducesResponseType(typeof(ApiResponse<DepositPolicyDto>), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
  public async Task<ActionResult<ApiResponse<DepositPolicyDto>>> UpdatePolicy(long id, [FromBody] UpsertDepositPolicyDto dto)
  {
    var result = await _depositPolicyService.UpdatePolicyAsync(id, dto);
    return this.OkResponse(ApiResponse<DepositPolicyDto>.SuccessResult(result, "Cap nhat chinh sach dat coc thanh cong."));
  }

  [HttpDelete("admin/{id:long}")]
  [Authorize(Roles = "Admin")]
  [SwaggerOperation(OperationId = "deleteDepositPolicy")]
  [ProducesResponseType(StatusCodes.Status204NoContent)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status401Unauthorized)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status403Forbidden)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(ErrorResponse), StatusCodes.Status409Conflict)]
  public async Task<IActionResult> DeletePolicy(long id)
  {
    await _depositPolicyService.DeletePolicyAsync(id);
    return this.NoContentResponse();
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
