using EduMatch.DTOs.Address;

namespace EduMatch.Services.Interfaces
{
  public interface IAddressService
  {
    Task<List<ProvinceDto>> GetProvincesAsync(CancellationToken ct = default);
    Task<List<WardDto>> GetWardsAsync(int provinceId, CancellationToken ct = default);
  }
}
