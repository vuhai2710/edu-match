using AutoMapper;
using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
using EduMatch.Enums;
using EduMatch.Exception;
using EduMatch.Models;
using EduMatch.Repositories;
using EduMatch.Services.Interfaces;
using Microsoft.AspNetCore.Http;

namespace EduMatch.Services;

public class TutorService : ITutorService
{
  private readonly IRepository<Subject> _subjectRepository;
  private readonly ITutorRepository _tutorRepository;
  private readonly IRepository<TutorSubject> _tutorSubjectRepository;
  private readonly IRepository<User> _userRepository;
  private readonly IFileService _fileService;
  private readonly IMapper _mapper;

  public TutorService(
    ITutorRepository tutorRepository,
    IRepository<User> userRepository,
    IRepository<Subject> subjectRepository,
    IRepository<TutorSubject> tutorSubjectRepository,
    IFileService fileService,
    IMapper mapper)
  {
    _tutorRepository = tutorRepository;
    _userRepository = userRepository;
    _subjectRepository = subjectRepository;
    _tutorSubjectRepository = tutorSubjectRepository;
    _fileService = fileService;
    _mapper = mapper;
  }

  public async Task<PagedResult<TutorDto>> GetTutorsAsync(TutorQueryParameters parameters)
  {
    var pagedProfiles = await _tutorRepository.GetTutorsAsync(parameters);

    return new PagedResult<TutorDto>
    {
      Items = _mapper.Map<List<TutorDto>>(pagedProfiles.Items),
      TotalCount = pagedProfiles.TotalCount,
      Page = pagedProfiles.Page,
      PageSize = pagedProfiles.PageSize,
      TotalPages = pagedProfiles.TotalPages
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

      if (dto.PhoneNumber != null)
      {
        user.PhoneNumber = dto.PhoneNumber;
      }

      profile = new Tutor
      {
        UserId = userId
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

  public async Task<FileDto> UpdateCvAsync(long userId, IFormFile file)
  {
    var profile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);
    if (profile == null || profile.IsDeleted)
    {
      throw new NotFoundException("Không tìm thấy hồ sơ gia sư");
    }

    if (profile.CvFileId.HasValue)
    {
      await _fileService.DeleteFileRecordAsync(profile.CvFileId.Value);
    }

    var savedFile = await _fileService.UploadCvAsync(file);
    profile.CvFileId = savedFile.Id;
    profile.UpdatedAt = DateTime.UtcNow;

    _tutorRepository.Update(profile);
    await _tutorRepository.SaveChangesAsync();

    return _mapper.Map<FileDto>(savedFile);
  }

  public async Task DeleteCvAsync(long userId)
  {
    var profile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);
    if (profile == null || profile.IsDeleted)
    {
      throw new NotFoundException("Không tìm thấy hồ sơ gia sư");
    }

    if (!profile.CvFileId.HasValue)
    {
      throw new AppException("Tutor chưa có CV", 400);
    }

    await _fileService.DeleteFileRecordAsync(profile.CvFileId.Value);
    profile.CvFileId = null;
    profile.UpdatedAt = DateTime.UtcNow;

    _tutorRepository.Update(profile);
    await _tutorRepository.SaveChangesAsync();
  }
}
