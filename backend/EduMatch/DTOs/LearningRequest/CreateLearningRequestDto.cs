using System.ComponentModel.DataAnnotations;

namespace EduMatch.DTOs.LearningRequests
{
  public class CreateLearningRequestDto
  {
    [Required(ErrorMessage = "Mã gia sư không được để trống.")]
    public long TutorId { get; set; }

    [Required(ErrorMessage = "Mã môn học không được để trống.")]
    public long SubjectId { get; set; }

    [MaxLength(1000, ErrorMessage = "Ghi chú không được vượt quá 1000 ký tự.")]
    public string? Note { get; set; }

    [Required(ErrorMessage = "Lịch học không được để trống.")]
    [MinLength(1, ErrorMessage = "Phải có ít nhất 1 khung giờ học.")]
    public List<TimeSlotInputDto> TimeSlots { get; set; } = [];

    [Required(ErrorMessage = "Ngày bắt đầu không được để trống.")]
    public DateTime DesiredStartDate { get; set; }

    [Required(ErrorMessage = "Số giờ mỗi buổi không được để trống.")]
    [Range(0.5, 3.0, ErrorMessage = "Số giờ mỗi buổi phải từ 0.5 đến 3 giờ.")]
    public decimal HoursPerSession { get; set; }

    [Required(ErrorMessage = "Ngân sách mỗi giờ không được để trống.")]
    [Range(0.01, 10000000, ErrorMessage = "Ngân sách mỗi giờ phải từ 0.01đ đến 10,000,000đ.")]
    public decimal BudgetPerHour { get; set; }
  }

  public class TimeSlotInputDto
  {
    [Required(ErrorMessage = "Ngày học không được để trống.")]
    public string Day { get; set; } = string.Empty;

    [Required(ErrorMessage = "Giờ bắt đầu không được để trống.")]
    public string StartTime { get; set; } = string.Empty;

    [Required(ErrorMessage = "Giờ kết thúc không được để trống.")]
    public string EndTime { get; set; } = string.Empty;
  }
}
