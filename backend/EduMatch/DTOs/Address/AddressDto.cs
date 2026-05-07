namespace EduMatch.DTOs.Address
{
  public class AddressDto
  {
    public long Id { get; set; }
    public int ProvinceId { get; set; }
    public string ProvinceName { get; set; } = string.Empty;
    public string WardCode { get; set; } = string.Empty;
    public string WardName { get; set; } = string.Empty;
    public string? AddressDetail { get; set; }
    public string FullAddress { get; set; } = string.Empty;
  }
}
