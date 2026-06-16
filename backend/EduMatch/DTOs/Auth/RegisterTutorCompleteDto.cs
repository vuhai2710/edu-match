using EduMatch.Common.Enums;
using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Auth
{
  public class RegisterTutorCompleteDto : RegisterDto
  {
    public string? Profile { get; set; }

    [Range(0.01, double.MaxValue, ErrorMessage = "Mức lương phải lớn hơn 0")]
    public decimal HourlyRate { get; set; }

    [Required(ErrorMessage = "Môn dạy không được để trống")]
    public List<long> SubjectIds { get; set; } = [];

    [Required(ErrorMessage = "Lớp dạy không được để trống")]
    public List<EducationLevel> TeachingLevels { get; set; } = [];

    [Required(ErrorMessage = "Trạng thái gia sư không được để trống")]
    public TutorCareerStatus? CareerStatus { get; set; }

    [Required(ErrorMessage = "Ngành học không được để trống")]
    public string Major { get; set; } = string.Empty;

    [Required(ErrorMessage = "Trình độ học vấn không được để trống")]
    public AcademicDegree? AcademicDegree { get; set; }

    [Range(1, long.MaxValue, ErrorMessage = "Ảnh đại diện không hợp lệ")]
    public long AvatarFileId { get; set; }

    [Required(ErrorMessage = "Upload token ảnh đại diện không được để trống")]
    public string AvatarUploadToken { get; set; } = string.Empty;

    [Range(1, long.MaxValue, ErrorMessage = "CV không hợp lệ")]
    public long CvFileId { get; set; }

    [Required(ErrorMessage = "Upload token CV không được để trống")]
    public string CvUploadToken { get; set; } = string.Empty;
  }
}
