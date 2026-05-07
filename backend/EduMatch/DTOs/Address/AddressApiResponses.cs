namespace EduMatch.DTOs.Address
{
  public class ProvinceApiResponse
  {
    public int Code { get; set; }

    public string Name { get; set; } = string.Empty;

    public List<WardApiResponse> Wards { get; set; } = new();
  }

  public class WardApiResponse
  {
    public int Code { get; set; }

    public string Name { get; set; } = string.Empty;

    public int ProvinceCode { get; set; }
  }
}
