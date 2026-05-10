using AutoMapper;
using EduMatch.Common.Exception;
using EduMatch.DTOs;
using EduMatch.DTOs.StudentProfile;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
  public class StudentService : IStudentService
  {
    private readonly IStudentRepository _studentRepository;
    private readonly ILogger<StudentService> _logger;
    private readonly IMapper _mapper;

    public StudentService(IStudentRepository studentRepository, ILogger<StudentService> logger, IMapper mapper)
    {
      _studentRepository = studentRepository;
      _logger = logger;
      _mapper = mapper;
    }

    public async Task<PagedResult<StudentDto>> GetStudentsAsync(StudentQueryParameters parameters)
    {
      var pagedProfiles = await _studentRepository.GetStudentsAsync(parameters);

      return new PagedResult<StudentDto>
      {
        Items = _mapper.Map<List<StudentDto>>(pagedProfiles.Items),
        Page = pagedProfiles.Page,
        PageSize = pagedProfiles.PageSize,
        TotalCount = pagedProfiles.TotalCount,
        TotalPages = pagedProfiles.TotalPages
      };
    }

    public async Task<StudentDetailDto> GetStudentByIdAsync(long studentId)
    {
      var profile = await _studentRepository.GetStudentDetailByIdAsync(studentId);
      if (profile == null)
      {
        throw new NotFoundException("Không tìm thấy thông tin học sinh.");
      }

      return _mapper.Map<StudentDetailDto>(profile);
    }

    public async Task<StudentDetailDto> GetMyProfileAsync(long currentUserId)
    {
      var profile = await _studentRepository.GetStudentDetailByUserIdAsync(currentUserId);
      if (profile == null)
      {
        throw new NotFoundException("Không tìm thấy thông tin học sinh.");
      }

      return _mapper.Map<StudentDetailDto>(profile);
    }

    public async Task<StudentDetailDto> UpdateMyProfileAsync(long currentUserId, UpdateStudentDto dto)
    {
      var profile = await _studentRepository.GetStudentDetailByUserIdAsync(currentUserId);
      if (profile == null)
      {
        throw new NotFoundException("Không tìm thấy thông tin học sinh.");
      }

      var user = profile.User ?? throw new InvalidOperationException("Student user was not loaded.");
      user.FullName = dto.FullName;
      user.Gender = dto.Gender;

      if (dto.PhoneNumber != null)
      {
        user.PhoneNumber = dto.PhoneNumber;
      }

      _mapper.Map(dto, profile);

      if (dto.Address != null)
      {
        if (profile.Address == null)
        {
          profile.Address = _mapper.Map<Address>(dto.Address);
        }
        else
        {
          _mapper.Map(dto.Address, profile.Address);
        }
      }

      _studentRepository.Update(profile);
      await _studentRepository.SaveChangesAsync();

      _logger.LogInformation("Student profile updated for User ID: {UserId}", currentUserId);

      return _mapper.Map<StudentDetailDto>(profile);
    }
  }
}
