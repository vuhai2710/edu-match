using EduMatch.Common.Enums;
using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.TutorRequests
{
  public class UpdateTutorRequestDto
  {
    [Required(ErrorMessage = "Mã môn học không được để trống.")]
    public long SubjectId { get; set; }

    [MaxLength(1000, ErrorMessage = "Ghi chú không được vượt quá 1000 ký tự.")]
    public string? Note { get; set; }

    [Required(ErrorMessage = "Học phí mỗi buổi không được để trống.")]
    [Range(0, 10_000_000, ErrorMessage = "Học phí mỗi buổi phải nằm trong khoảng từ 0đ đến 10,000,000đ.")]
    public decimal PricePerSession { get; set; }

    [Required(ErrorMessage = "Thời hạn yêu cầu không được để trống.")]
    public DateTime ExpiresAt { get; set; }

    public string? PreferredSchedule { get; set; }

    [Required(ErrorMessage = "Số buổi mỗi tuần không được để trống.")]
    [Range(1, 7, ErrorMessage = "Số buổi mỗi tuần phải từ 1 đến 7 buổi.")]
    public int SessionsPerWeek { get; set; }

    [Required(ErrorMessage = "Số phút mỗi buổi không được để trống.")]
    [Range(30, 240, ErrorMessage = "Số phút mỗi buổi phải từ 30 đến 240 phút.")]
    public int MinutesPerSession { get; set; }

    public Grade? GradeLevel { get; set; }
    public EducationLevel? EducationLevel { get; set; }

    public int? ProvinceId { get; set; }
    public string? ProvinceName { get; set; }
    public string? WardCode { get; set; }
    public string? WardName { get; set; }
    public string? AddressDetail { get; set; }
  }
}
