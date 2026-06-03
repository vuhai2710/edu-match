using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Address
{
  public class CreateAddressDto
  {
    [Required(ErrorMessage = "Mã tỉnh/thành phố không được để trống.")]
    public int ProvinceId { get; set; }
    
    [Required(ErrorMessage = "Tên tỉnh/thành phố không được để trống.")]
    public string ProvinceName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Mã phường/xã không được để trống.")]
    public string WardCode { get; set; } = string.Empty;
    
    [Required(ErrorMessage = "Tên phường/xã không được để trống.")]
    public string WardName { get; set; } = string.Empty;

    public string? AddressDetail { get; set; }
  }
}
