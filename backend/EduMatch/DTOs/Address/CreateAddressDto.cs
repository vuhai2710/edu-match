using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Address
{
  public class CreateAddressDto
  {
    [Required]
    public int ProvinceId { get; set; }
    
    [Required]
    public string ProvinceName { get; set; } = string.Empty;

    [Required]
    public string WardCode { get; set; } = string.Empty;
    
    [Required]
    public string WardName { get; set; } = string.Empty;

    public string? AddressDetail { get; set; }
  }
}
