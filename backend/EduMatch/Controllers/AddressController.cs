using Swashbuckle.AspNetCore.Annotations;
using EduMatch.DTOs;
using EduMatch.DTOs.Address;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.Controllers
{
  [Route("api/[controller]")]
  [ApiController]
  public class AddressController : ControllerBase
  {
    private readonly IAddressService _addressService;

    public AddressController(IAddressService addressService)
    {
      _addressService = addressService;
    }

    [HttpGet("provinces")]
    [SwaggerOperation(OperationId = "getProvinces")]
    public async Task<ActionResult<ApiResponse<List<ProvinceDto>>>> GetProvinces(CancellationToken ct)
    {
      var result = await _addressService.GetProvincesAsync(ct);
      return Ok(ApiResponse<List<ProvinceDto>>.SuccessResult(result));
    }

    [HttpGet("wards/{provinceId}")]
    [SwaggerOperation(OperationId = "getWards")]
    public async Task<ActionResult<ApiResponse<List<WardDto>>>> GetWards(int provinceId, CancellationToken ct)
    {
      var result = await _addressService.GetWardsAsync(provinceId, ct);
      return Ok(ApiResponse<List<WardDto>>.SuccessResult(result));
    }
  }
}
