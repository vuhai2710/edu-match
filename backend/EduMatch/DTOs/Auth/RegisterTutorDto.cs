using EduMatch.Common.Enums;
using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Auth
{
  public class RegisterTutorDto : RegisterDto
  {
    [Required(ErrorMessage = "Ảnh đại diện không được để trống")]
    public IFormFile? Avatar { get; set; }

    [Required(ErrorMessage = "CV không được để trống")]
    public IFormFile? Cv { get; set; }

    [Required(ErrorMessage = "Mô tả kinh nghiệm không được để trống")]
    public string Bio { get; set; } = string.Empty;

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
  }
}
