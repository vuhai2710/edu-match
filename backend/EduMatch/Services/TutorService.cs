using AutoMapper;
using EduMatch.Common.Exception;
using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
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
  private readonly IRepository<TutorTeachingLevel> _tutorTeachingLevelRepository;
  private readonly IRepository<User> _userRepository;
  private readonly IFileService _fileService;
  private readonly IMapper _mapper;
  private readonly ICodeGeneratorService _codeGenerator;

  public TutorService(
    ITutorRepository tutorRepository,
    IRepository<User> userRepository,
    IRepository<Subject> subjectRepository,
    IRepository<TutorSubject> tutorSubjectRepository,
    IRepository<TutorTeachingLevel> tutorTeachingLevelRepository,
    IFileService fileService,
    IMapper mapper,
    ICodeGeneratorService codeGenerator)
  {
    _tutorRepository = tutorRepository;
    _userRepository = userRepository;
    _subjectRepository = subjectRepository;
    _tutorSubjectRepository = tutorSubjectRepository;
    _tutorTeachingLevelRepository = tutorTeachingLevelRepository;
    _fileService = fileService;
    _mapper = mapper;
    _codeGenerator = codeGenerator;
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
    if (profile == null)
    {
      throw new NotFoundException("Không tìm thấy hồ sơ gia sư.", "TUTOR_PROFILE_NOT_FOUND");
    }

    return _mapper.Map<TutorDetailDto>(profile);
  }

  public async Task<TutorDetailDto> GetTutorByUserIdAsync(long userId)
  {
    var profile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);
    if (profile == null)
    {
      throw new NotFoundException("Không tìm thấy hồ sơ gia sư của người dùng này.", "TUTOR_PROFILE_NOT_FOUND");
    }

    return _mapper.Map<TutorDetailDto>(profile);
  }

  public async Task<TutorDetailDto> UpdateTutorProfileAsync(long userId, UpdateTutorDto dto)
  {
    var profile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);

    if (profile == null)
    {
      var user = await _userRepository.GetByIdAsync(userId);
      if (user == null)
      {
        throw new NotFoundException("Không tìm thấy người dùng.", "USER_NOT_FOUND");
      }

      user.FullName = dto.FullName;
      user.Gender = dto.Gender;

      if (dto.PhoneNumber != null)
      {
        user.PhoneNumber = dto.PhoneNumber;
      }

      profile = new Tutor
      {
        Code = _codeGenerator.GenerateTemporaryCode("TUT"),
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
      var user = profile.User ?? throw new InvalidOperationException("Tutor user was not loaded.");

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

      _tutorRepository.Update(profile);

      if (profile.TutorSubjects.Any())
      {
        _tutorSubjectRepository.RemoveRange(profile.TutorSubjects);
      }

      if (profile.TeachingLevels.Any())
      {
        _tutorTeachingLevelRepository.RemoveRange(profile.TeachingLevels);
      }
    }

    if (dto.Subjects != null && dto.Subjects.Any())
    {
      var subjectIds = dto.Subjects.Select(subject => subject.SubjectId).Distinct().ToList();
      var validSubjects = await _subjectRepository.FindAsync(subject => subjectIds.Contains(subject.Id));
      var validSubjectIds = validSubjects.Select(subject => subject.Id).ToHashSet();
      var invalidSubjectIds = subjectIds.Where(subjectId => !validSubjectIds.Contains(subjectId)).Distinct().ToArray();

      if (invalidSubjectIds.Length > 0)
      {
        throw new ValidationException(
          new Dictionary<string, string[]>
          {
            [nameof(dto.Subjects)] = [$"Các môn học không tồn tại: {string.Join(", ", invalidSubjectIds)}."]
          },
          "INVALID_TUTOR_SUBJECTS");
      }

      foreach (var subDto in dto.Subjects)
      {
        await _tutorSubjectRepository.AddAsync(new TutorSubject
        {
          Tutor = profile,
          SubjectId = subDto.SubjectId
        });
      }
    }

    if (dto.TeachingLevels != null && dto.TeachingLevels.Any())
    {
      foreach (var teachingLevel in dto.TeachingLevels.Distinct())
      {
        await _tutorTeachingLevelRepository.AddAsync(new TutorTeachingLevel
        {
          Tutor = profile,
          TeachingLevel = teachingLevel
        });
      }
    }

    await _tutorRepository.SaveChangesAsync();

    var updatedProfile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);
    if (updatedProfile == null)
    {
      throw new NotFoundException("Không tìm thấy hồ sơ gia sư sau khi cập nhật.", "TUTOR_PROFILE_NOT_FOUND");
    }

    return _mapper.Map<TutorDetailDto>(updatedProfile);
  }

  public async Task<FileDto> UpdateCvAsync(long userId, IFormFile file)
  {
    var profile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);
    if (profile == null || profile.IsDeleted)
    {
      throw new NotFoundException("Không tìm thấy hồ sơ gia sư.", "TUTOR_PROFILE_NOT_FOUND");
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
      throw new NotFoundException("Không tìm thấy hồ sơ gia sư.", "TUTOR_PROFILE_NOT_FOUND");
    }

    if (!profile.CvFileId.HasValue)
    {
      throw new ValidationException("Gia sư chưa có CV.", "TUTOR_CV_NOT_FOUND");
    }

    await _fileService.DeleteFileRecordAsync(profile.CvFileId.Value);
    profile.CvFileId = null;
    profile.UpdatedAt = DateTime.UtcNow;

    _tutorRepository.Update(profile);
    await _tutorRepository.SaveChangesAsync();
  }
}
