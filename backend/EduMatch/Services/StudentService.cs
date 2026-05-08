using AutoMapper;
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

    public async Task<StudentDetailDto> GetStudentByIdAsync(long id)
    {
      var profile = await _studentRepository.GetStudentDetailAsync(id);
      if (profile == null)
      {
        throw new AppException("Không tìm thấy thông tin học sinh", 404);
      }

      return _mapper.Map<StudentDetailDto>(profile);
    }

    public async Task<StudentDetailDto> GetMyProfileAsync(long currentUserId)
    {
      var profile = await _studentRepository.GetStudentDetailAsync(currentUserId);
      if (profile == null)
      {
        throw new AppException("Không tìm thấy thông tin học sinh", 404);
      }

      return _mapper.Map<StudentDetailDto>(profile);
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
      
      if (dto.PhoneNumber != null)
      {
        profile.User.PhoneNumber = dto.PhoneNumber;
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
