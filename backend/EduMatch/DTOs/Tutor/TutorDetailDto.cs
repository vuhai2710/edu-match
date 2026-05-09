using EduMatch.DTOs.Address;

namespace EduMatch.DTOs.Tutor
{
  public class TutorDetailDto
  {
    public long Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? CvUrl { get; set; }
    public string Bio { get; set; } = string.Empty;
    public decimal HourlyRate { get; set; }
    public double Rating { get; set; }
    public long TotalReviews { get; set; }
    public AddressDto? Address { get; set; }
    public List<TutorSubjectDto> Subjects { get; set; } = [];
  }
}

