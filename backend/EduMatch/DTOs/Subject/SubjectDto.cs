using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.Subject
{
  public class SubjectDto
  {
    [Required(ErrorMessage = "Tên môn học không được để trống")]
    [MaxLength(100, ErrorMessage = "Tên môn học không được vượt quá 100 ký tự.")]
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
  }
}
