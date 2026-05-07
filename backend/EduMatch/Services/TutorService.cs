using AutoMapper;
using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
using EduMatch.Enums;
using EduMatch.Exception;
using EduMatch.Models;
using EduMatch.Repositories;

namespace EduMatch.Services;

public class TutorService : ITutorService
{
  private readonly IRepository<Subject> _subjectRepository;
  private readonly ITutorRepository _tutorRepository;
  private readonly IRepository<TutorSubject> _tutorSubjectRepository;
  private readonly IRepository<User> _userRepository;
  private readonly IMapper _mapper;

  public TutorService(
    ITutorRepository tutorRepository,
    IRepository<User> userRepository,
    IRepository<Subject> subjectRepository,
    IRepository<TutorSubject> tutorSubjectRepository,
    IMapper mapper)
  {
    _tutorRepository = tutorRepository;
    _userRepository = userRepository;
    _subjectRepository = subjectRepository;
    _tutorSubjectRepository = tutorSubjectRepository;
    _mapper = mapper;
  }

  public async Task<PagedResponse<TutorDto>> GetTutorsAsync(int pageNumber, int pageSize, int? provinceId = null, string? wardCode = null)
  {
    var pagedProfiles = await _tutorRepository.GetTutorsAsync(pageNumber, pageSize, provinceId, wardCode);

    return new PagedResponse<TutorDto>
    {
      Items = _mapper.Map<List<TutorDto>>(pagedProfiles.Items),
      TotalCount = pagedProfiles.TotalCount,
      PageNumber = pagedProfiles.PageNumber,
      PageSize = pagedProfiles.PageSize
    };
  }

  public async Task<TutorDetailDto> GetTutorByIdAsync(long id)
  {
    var profile = await _tutorRepository.GetTutorProfileDetailAsync(id);
    if (profile == null) throw new AppException("Tutor profile not found.", 404);

    return _mapper.Map<TutorDetailDto>(profile);
  }

  public async Task<TutorDetailDto> GetTutorByUserIdAsync(long userId)
  {
    var profile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);
    if (profile == null) throw new AppException("Tutor profile not found for this user.", 404);

    return _mapper.Map<TutorDetailDto>(profile);
  }

  public async Task<TutorDetailDto> UpdateTutorProfileAsync(long userId, UpdateTutorDto dto)
  {
    var profile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);

    if (profile == null)
    {
      var user = await _userRepository.GetByIdAsync(userId);
      if (user == null) throw new AppException("User not found.", 404);

      profile = new Tutor
      {
        UserId = userId,
        ApprovalStatus = ApprovalStatus.Pending
      };
      _mapper.Map(dto, profile);
      
      if (dto.Address != null)
      {
        profile.Address = _mapper.Map<Address>(dto.Address);
      }
      
      await _tutorRepository.AddAsync(profile);
    }
    else
    {
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
      
      _tutorRepository.Update(profile);

      if (profile.TutorSubjects.Any()) _tutorSubjectRepository.RemoveRange(profile.TutorSubjects);
    }

    if (dto.Subjects != null && dto.Subjects.Any())
    {
      var subjectIds = dto.Subjects.Select(s => s.SubjectId).ToList();
      var validSubjects = await _subjectRepository.FindAsync(s => subjectIds.Contains(s.Id));

      foreach (var subDto in dto.Subjects)
        if (validSubjects.Any(vs => vs.Id == subDto.SubjectId))
        {
          var tutorSubject = new TutorSubject
          {
            Tutor = profile,
            SubjectId = subDto.SubjectId,
            Level = subDto.Level
          };
          await _tutorSubjectRepository.AddAsync(tutorSubject);
        }
    }

    await _tutorRepository.SaveChangesAsync();

    var updatedProfile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);
    return _mapper.Map<TutorDetailDto>(updatedProfile!);
  }
}
