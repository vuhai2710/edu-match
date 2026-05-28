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
  private readonly IHttpContextAccessor _httpContextAccessor;

  public TutorService(
    ITutorRepository tutorRepository,
    IRepository<User> userRepository,
    IRepository<Subject> subjectRepository,
    IRepository<TutorSubject> tutorSubjectRepository,
    IRepository<TutorTeachingLevel> tutorTeachingLevelRepository,
    IFileService fileService,
    IMapper mapper,
    ICodeGeneratorService codeGenerator,
    IHttpContextAccessor httpContextAccessor)
  {
    _tutorRepository = tutorRepository;
    _userRepository = userRepository;
    _subjectRepository = subjectRepository;
    _tutorSubjectRepository = tutorSubjectRepository;
    _tutorTeachingLevelRepository = tutorTeachingLevelRepository;
    _fileService = fileService;
    _mapper = mapper;
    _codeGenerator = codeGenerator;
    _httpContextAccessor = httpContextAccessor;
  }

  public async Task<ApiResponse<PagedResult<TutorDto>>> GetTutorsAsync(TutorQueryParameters parameters)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
    {
      var user = _httpContextAccessor.HttpContext?.User;
      bool isAdmin = user?.IsInRole("Admin") ?? false;
      var pagedProfiles = await _tutorRepository.GetTutorsAsync(parameters, isAdmin);

      return ApiResponse<PagedResult<TutorDto>>.SuccessResult(new PagedResult<TutorDto>
      {
        Items = _mapper.Map<List<TutorDto>>(pagedProfiles.Items),
        TotalCount = pagedProfiles.TotalCount,
        Page = pagedProfiles.Page,
        PageSize = pagedProfiles.PageSize,
        TotalPages = pagedProfiles.TotalPages
      });
    });
  }

  public async Task<ApiResponse<TutorDetailDto>> GetTutorByIdOrCodeAsync(string idOrCode)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
    {
      Tutor? profile = null;

      if (long.TryParse(idOrCode, out var id))
      {
        profile = await _tutorRepository.GetTutorProfileDetailAsync(id);
      }

      if (profile == null && !string.IsNullOrWhiteSpace(idOrCode))
      {
        profile = await _tutorRepository.GetTutorProfileDetailByCodeAsync(idOrCode);
      }

      if (profile == null)
      {
        throw new NotFoundException("Không tìm thấy hồ sơ gia sư.", "TUTOR_PROFILE_NOT_FOUND");
      }

      return ApiResponse<TutorDetailDto>.SuccessResult(MapTutorDetail(profile));
    });
  }

  public async Task<ApiResponse<TutorDetailDto>> GetTutorByUserIdAsync(long userId)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
    {
      var profile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);
      if (profile == null)
      {
        throw new NotFoundException("Không tìm thấy hồ sơ gia sư của người dùng này.", "TUTOR_PROFILE_NOT_FOUND");
      }

      return ApiResponse<TutorDetailDto>.SuccessResult(MapTutorDetail(profile));
    });
  }

  public async Task<ApiResponse<TutorDetailDto>> UpdateTutorProfileAsync(long userId, UpdateTutorDto dto)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
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
        user.Birth = dto.Birth;
        user.Gender = dto.Gender;
        user.School = string.IsNullOrWhiteSpace(dto.School) ? null : dto.School.Trim();

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
        var user = profile.User ?? throw new DataConsistencyException("Tutor user relationship was not loaded.");

        user.FullName = dto.FullName;
        user.Birth = dto.Birth;
        user.Gender = dto.Gender;
        user.School = string.IsNullOrWhiteSpace(dto.School) ? null : dto.School.Trim();

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

      return ApiResponse<TutorDetailDto>.SuccessResult(
        MapTutorDetail(updatedProfile),
        "Tutor profile updated successfully");
    });
  }

  public async Task<ApiResponse<FileDto>> UpdateCvAsync(long userId, IFormFile file)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
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

      return ApiResponse<FileDto>.SuccessResult(MapFileDto(savedFile), "Cập nhật CV thành công");
    });
  }

  public async Task<ApiResponse> DeleteCvAsync(long userId)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
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

      return ApiResponse.Ok("Xóa CV thành công");
    });
  }

  private TutorDetailDto MapTutorDetail(Tutor profile)
  {
    var dto = _mapper.Map<TutorDetailDto>(profile);
    dto.CvUrl = BuildCloudinaryViewUrl(profile.CvFile?.FilePath);
    return dto;
  }

  private FileDto MapFileDto(EduMatch.Models.File file)
  {
    var dto = _mapper.Map<FileDto>(file);
    dto.FilePath = BuildCloudinaryViewUrl(file.FilePath) ?? file.FilePath;
    return dto;
  }

  private string? BuildCloudinaryViewUrl(string? filePath)
  {
    if (string.IsNullOrWhiteSpace(filePath)
        || !Uri.TryCreate(filePath, UriKind.Absolute, out var uri)
        || !string.Equals(uri.Host, "res.cloudinary.com", StringComparison.OrdinalIgnoreCase))
    {
      return filePath;
    }

    var request = _httpContextAccessor.HttpContext?.Request;
    if (request == null)
    {
      return filePath;
    }

    var baseUrl = $"{request.Scheme}://{request.Host}{request.PathBase}";
    return $"{baseUrl}/api/Files/cloudinary/view?url={Uri.EscapeDataString(filePath)}";
  }
}
