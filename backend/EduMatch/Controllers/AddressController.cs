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
    [ProducesResponseType(typeof(ApiResponse<List<ProvinceDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<ProvinceDto>>>> GetProvinces(CancellationToken ct)
    {
      var result = await _addressService.GetProvincesAsync(ct);
      return Ok(ApiResponse<List<ProvinceDto>>.SuccessResult(result));
    }

    [HttpGet("wards/{provinceId}")]
    [ProducesResponseType(typeof(ApiResponse<List<WardDto>>), StatusCodes.Status200OK)]
    public async Task<ActionResult<ApiResponse<List<WardDto>>>> GetWards(int provinceId, CancellationToken ct)
    {
      var result = await _addressService.GetWardsAsync(provinceId, ct);
      return Ok(ApiResponse<List<WardDto>>.SuccessResult(result));
    }
  }
}
