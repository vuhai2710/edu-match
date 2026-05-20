using AutoMapper;
using EduMatch.Common.Exception;
using EduMatch.DTOs;
using EduMatch.DTOs.Subject;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
  public class SubjectService : ISubjectService
  {
    private readonly ISubjectRepository _subjectRepository;
    private readonly IMapper _mapper;

    public SubjectService(ISubjectRepository subjectRepository, IMapper mapper)
    {
      _subjectRepository = subjectRepository;
      _mapper = mapper;
    }

    public async Task<List<SubjectListItemDto>> GetSubjectsAsync()
    {
      var subjects = await _subjectRepository.GetAllActiveSubjectsWithTutorCountAsync();

      return subjects.Select(s => new SubjectListItemDto
      {
        Id = s.Id,
        Name = s.Name,
        Description = s.Description,
        TutorCount = s.TutorSubjects.Count
      }).ToList();
    }

    public async Task<PagedResult<TutorCardDto>> GetTutorsBySubjectAsync(
      long subjectId,
      TutorBySubjectQueryParameters parameters)
    {
      var subjectExists = await _subjectRepository.ExistsAsync(s => s.Id == subjectId);
      if (!subjectExists)
      {
        throw new NotFoundException("Không tìm thấy môn học.", "SUBJECT_NOT_FOUND");
      }

      var pagedTutors = await _subjectRepository.GetTutorsBySubjectAsync(subjectId, parameters);

      return new PagedResult<TutorCardDto>
      {
        Items = pagedTutors.Items.Select(MapToTutorCard).ToList(),
        TotalCount = pagedTutors.TotalCount,
        Page = pagedTutors.Page,
        PageSize = pagedTutors.PageSize,
        TotalPages = pagedTutors.TotalPages
      };
    }

    public async Task<SubjectResponseDto> GetSubjectByIdAsync(long id)
    {
      var subject = await _subjectRepository.GetByIdAsync(id);
      if (subject == null || subject.IsDeleted)
      {
        throw new NotFoundException("Không tìm thấy môn học.", "SUBJECT_NOT_FOUND");
      }
      return _mapper.Map<SubjectResponseDto>(subject);
    }

    public async Task<SubjectResponseDto> CreateSubjectAsync(SubjectDto dto)
    {
      var trimmedName = dto.Name.Trim();
      var nameExists = await _subjectRepository.ExistsAsync(s => s.Name.ToLower() == trimmedName.ToLower() && !s.IsDeleted);
      if (nameExists)
      {
        throw new ConflictException("Môn học với tên này đã tồn tại.", "SUBJECT_NAME_ALREADY_EXISTS");
      }

      var subject = _mapper.Map<Subject>(dto);
      subject.Name = trimmedName;

      await _subjectRepository.AddAsync(subject);
      await _subjectRepository.SaveChangesAsync();

      return _mapper.Map<SubjectResponseDto>(subject);
    }

    public async Task<SubjectResponseDto> UpdateSubjectAsync(long id, SubjectDto dto)
    {
      var subject = await _subjectRepository.GetByIdAsync(id);
      if (subject == null || subject.IsDeleted)
      {
        throw new NotFoundException("Không tìm thấy môn học.", "SUBJECT_NOT_FOUND");
      }

      var trimmedName = dto.Name.Trim();
      var nameExists = await _subjectRepository.ExistsAsync(s => s.Id != id && s.Name.ToLower() == trimmedName.ToLower() && !s.IsDeleted);
      if (nameExists)
      {
        throw new ConflictException("Môn học với tên này đã tồn tại.", "SUBJECT_NAME_ALREADY_EXISTS");
      }

      _mapper.Map(dto, subject);
      subject.Name = trimmedName;
      subject.UpdatedAt = DateTime.UtcNow;

      _subjectRepository.Update(subject);
      await _subjectRepository.SaveChangesAsync();

      return _mapper.Map<SubjectResponseDto>(subject);
    }

    public async Task DeleteSubjectAsync(long id)
    {
      var subject = await _subjectRepository.GetByIdAsync(id);
      if (subject == null || subject.IsDeleted)
      {
        throw new NotFoundException("Không tìm thấy môn học.", "SUBJECT_NOT_FOUND");
      }

      subject.IsDeleted = true;
      subject.UpdatedAt = DateTime.UtcNow;

      _subjectRepository.Update(subject);
      await _subjectRepository.SaveChangesAsync();
    }

    private static TutorCardDto MapToTutorCard(Tutor tutor)
    {
      return new TutorCardDto
      {
        TutorId = tutor.Id,
        FullName = tutor.User?.FullName ?? string.Empty,
        AvatarUrl = tutor.User?.AvatarFile?.FilePath,
        Gender = tutor.User?.Gender ?? default,
        Rating = tutor.Rating,
        TotalReviews = tutor.TotalReviews,
        HourlyRate = tutor.HourlyRate,
        Bio = tutor.Bio,
        Major = tutor.Major,
        Subjects = tutor.TutorSubjects
          .Where(ts => ts.Subject != null)
          .Select(ts => ts.Subject.Name)
          .ToList(),
        TeachingLevels = tutor.TeachingLevels
          .Select(tl => tl.TeachingLevel)
          .ToList()
      };
    }
  }
}
