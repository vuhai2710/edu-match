using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace EduMatch.DTOs.DepositPolicy;

public class DepositPreviewRequestDto
{
  [FromQuery(Name = "hourlyRate")]
  [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ErrorMessage = "HourlyRate phai lon hon 0.")]
  public decimal HourlyRate { get; set; }

  [FromQuery(Name = "hoursPerSession")]
  [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ErrorMessage = "HoursPerSession phai lon hon 0.")]
  public decimal HoursPerSession { get; set; }
}
