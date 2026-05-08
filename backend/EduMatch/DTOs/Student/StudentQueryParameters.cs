namespace EduMatch.DTOs.StudentProfile
{
  public class StudentQueryParameters : BaseQueryParameters
  {
    public int? ProvinceId { get; set; }
    public string? WardCode { get; set; }
  }
}
