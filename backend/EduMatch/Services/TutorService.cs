using EduMatch.DTOs;
using EduMatch.DTOs.Tutor;
using EduMatch.Exception;
using EduMatch.Models;
using EduMatch.Repositories;
using EduMatch.Shared.Enums;

namespace EduMatch.Services;

public class TutorService : ITutorService
{
  private readonly IRepository<Subject> _subjectRepository;
  private readonly ITutorRepository _tutorRepository;
  private readonly IRepository<TutorSubject> _tutorSubjectRepository;
  private readonly IRepository<User> _userRepository;

  public TutorService(
    ITutorRepository tutorRepository,
    IRepository<User> userRepository,
    IRepository<Subject> subjectRepository,
    IRepository<TutorSubject> tutorSubjectRepository)
  {
    _tutorRepository = tutorRepository;
    _userRepository = userRepository;
    _subjectRepository = subjectRepository;
    _tutorSubjectRepository = tutorSubjectRepository;
  }

  public async Task<PagedResponse<TutorDto>> GetTutorsAsync(int pageNumber, int pageSize)
  {
    var pagedProfiles = await _tutorRepository.GetTutorsAsync(pageNumber, pageSize);

    var dtos = pagedProfiles.Items.Select(t => new TutorDto
    {
      Id = t.Id,
      UserId = t.UserId,
      FullName = t.User?.FullName ?? "",
      AvatarUrl = t.User?.AvatarUrl,
      HourlyRate = t.HourlyRate,
      Rating = t.Rating,
      TotalReviews = t.TotalReviews,
      Subjects = t.TutorSubjects.Select(ts => new TutorSubjectDto
      {
        SubjectId = ts.SubjectId,
        SubjectName = ts.Subject?.Name ?? "",
        Level = ts.Level
      }).ToList()
    });

    return new PagedResponse<TutorDto>
    {
      Items = dtos,
      TotalCount = pagedProfiles.TotalCount,
      PageNumber = pagedProfiles.PageNumber,
      PageSize = pagedProfiles.PageSize
    };
  }

  public async Task<TutorDetailDto> GetTutorByIdAsync(long id)
  {
    var profile = await _tutorRepository.GetTutorProfileDetailAsync(id);
    if (profile == null) throw new AppException("Tutor profile not found.", 404);

    return MapToDetailDto(profile);
  }

  public async Task<TutorDetailDto> GetTutorByUserIdAsync(long userId)
  {
    var profile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);
    if (profile == null) throw new AppException("Tutor profile not found for this user.", 404);

    return MapToDetailDto(profile);
  }

  public async Task<TutorDetailDto> UpdateTutorProfileAsync(long userId, UpdateTutorDto dto)
  {
    var profile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);

    if (profile == null)
    {
      // Create if it doesn't exist
      var user = await _userRepository.GetByIdAsync(userId);
      if (user == null) throw new AppException("User not found.", 404);

      profile = new Tutor
      {
        UserId = userId,
        Bio = dto.Bio,
        HourlyRate = dto.HourlyRate,
        ApprovalStatus = ApprovalStatus.Pending
      };
      await _tutorRepository.AddAsync(profile);
    }
    else
    {
      // Update existing
      profile.Bio = dto.Bio;
      profile.HourlyRate = dto.HourlyRate;
      _tutorRepository.Update(profile);

      // Remove existing subjects
      if (profile.TutorSubjects.Any()) _tutorSubjectRepository.RemoveRange(profile.TutorSubjects);
    }

    // Add new subjects
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

    // Fetch again to get updated includes
    var updatedProfile = await _tutorRepository.GetTutorProfileByUserIdAsync(userId);
    return MapToDetailDto(updatedProfile!);
  }

  private TutorDetailDto MapToDetailDto(Tutor profile)
  {
    return new TutorDetailDto
    {
      Id = profile.Id,
      UserId = profile.UserId,
      FullName = profile.User?.FullName ?? "",
      Email = profile.User?.Email ?? "",
      AvatarUrl = profile.User?.AvatarUrl,
      Bio = profile.Bio,
      HourlyRate = profile.HourlyRate,
      Rating = profile.Rating,
      TotalReviews = profile.TotalReviews,
      ApprovalStatus = profile.ApprovalStatus,
      Subjects = profile.TutorSubjects.Select(ts => new TutorSubjectDto
      {
        SubjectId = ts.SubjectId,
        SubjectName = ts.Subject?.Name ?? "",
        Level = ts.Level
      }).ToList()
    };
  }
}