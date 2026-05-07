using EduMatch.DTOs;
using EduMatch.DTOs.StudentProfile;
using EduMatch.Exception;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
  public class StudentService : IStudentService
  {
    private readonly IStudentRepository _studentRepository;
    private readonly ILogger<StudentService> _logger;

    public StudentService(IStudentRepository studentRepository, ILogger<StudentService> logger)
    {
      _studentRepository = studentRepository;
      _logger = logger;
    }

    public async Task<PagedResponse<StudentDto>> GetStudentsAsync(int pageNumber, int pageSize)
    {
      var pagedProfiles = await _studentRepository.GetStudentsAsync(pageNumber, pageSize);

      var dtos = pagedProfiles.Items.Select(p => new StudentDto
      {
        UserId = p.UserId,
        FullName = p.User.FullName,
        AvatarUrl = p.User.AvatarUrl,
        Gender = p.User.Gender,
        GradeLevel = p.GradeLevel,
        School = p.School
      }).ToList();

      return new PagedResponse<StudentDto>
      {
          Items = dtos,
          PageNumber = pagedProfiles.PageNumber,
          PageSize = pagedProfiles.PageSize,
          TotalCount = pagedProfiles.TotalCount
      };
    }

    public async Task<StudentDetailDto> GetStudentByIdAsync(long id)
    {
      var profile = await _studentRepository.GetStudentDetailAsync(id);
      if (profile == null)
      {
        throw new AppException("Không tìm thấy thông tin học sinh", 404);
      }

      return MapToDetailDto(profile);
    }

    public async Task<StudentDetailDto> GetMyProfileAsync(long currentUserId)
    {
      var profile = await _studentRepository.GetStudentDetailAsync(currentUserId);
      if (profile == null)
      {
        throw new AppException("Không tìm thấy thông tin học sinh", 404);
      }

      return MapToDetailDto(profile);
    }

    public async Task<StudentDetailDto> UpdateMyProfileAsync(long currentUserId, UpdateStudentDto dto)
    {
      var profile = await _studentRepository.GetStudentDetailAsync(currentUserId);
      if (profile == null)
      {
        throw new AppException("Không tìm thấy thông tin học sinh", 404);
      }

      profile.User.FullName = dto.FullName;
      profile.User.Gender = dto.Gender;
      profile.User.AvatarUrl = dto.AvatarUrl;
      profile.Bio = dto.Bio;
      profile.School = dto.School;
      profile.GradeLevel = dto.GradeLevel;

      _studentRepository.Update(profile);
      await _studentRepository.SaveChangesAsync();

      _logger.LogInformation("Student profile updated for User ID: {UserId}", currentUserId);

      return MapToDetailDto(profile);
    }

    private StudentDetailDto MapToDetailDto(Student profile)
    {
      return new StudentDetailDto
      {
        UserId = profile.UserId,
        FullName = profile.User.FullName,
        Email = profile.User.Email,
        AvatarUrl = profile.User.AvatarUrl,
        Gender = profile.User.Gender,
        Bio = profile.Bio,
        School = profile.School,
        GradeLevel = profile.GradeLevel
      };
    }
  }
}
