using EduMatch.Common.Enums;
using Microsoft.AspNetCore.Http;

namespace EduMatch.DTOs.Auth
{
  public class RegisterStudentDto : RegisterDto
  {
    public IFormFile? Avatar { get; set; }
    public Grade? GradeLevel { get; set; }
  }
}
