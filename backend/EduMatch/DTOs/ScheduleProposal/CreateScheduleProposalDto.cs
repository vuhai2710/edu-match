using System.ComponentModel.DataAnnotations;
using EduMatch.DTOs.LearningRequests;

namespace EduMatch.DTOs.ScheduleProposals
{
  public class CreateScheduleProposalDto
  {
    [Required(ErrorMessage = "Mã yêu cầu học không được để trống.")]
    public long LearningRequestId { get; set; }

    [Required(ErrorMessage = "Lịch học không được để trống.")]
    [MinLength(1, ErrorMessage = "Phải có ít nhất 1 khung giờ học.")]
    public List<TimeSlotInputDto> TimeSlots { get; set; } = [];

    [Required(ErrorMessage = "Ngày bắt đầu không được để trống.")]
    public DateTime DesiredStartDate { get; set; }

    [Required(ErrorMessage = "Số giờ mỗi buổi không được để trống.")]
    [Range(0.5, 3.0, ErrorMessage = "Số giờ mỗi buổi phải từ 0.5 đến 3 giờ.")]
    public decimal HoursPerSession { get; set; }

    [Required(ErrorMessage = "Học phí mỗi giờ không được để trống.")]
    [Range(0.01, 10000000, ErrorMessage = "Học phí mỗi giờ phải từ 0.01đ đến 10,000,000đ.")]
    public decimal HourlyRate { get; set; }
  }
}
