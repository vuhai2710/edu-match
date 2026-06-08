using System.Net.Http.Json;
using AutoMapper;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Configurations;
using EduMatch.DTOs;
using EduMatch.DTOs.Recommendations;
using EduMatch.DTOs.Tutor;
using EduMatch.Models;
using EduMatch.Repositories;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.Extensions.Options;

namespace EduMatch.Services
{
  public class RecommendationService : IRecommendationService
  {
    private const int RecommendationTopK = 3;
    private const int RecentLearningRequestLimit = 10;

    private readonly HttpClient _httpClient;
    private readonly ITutorRepository _tutorRepository;
    private readonly IStudentRepository _studentRepository;
    private readonly ILearningRequestRepository _learningRequestRepository;
    private readonly ISubjectRepository _subjectRepository;
    private readonly IMapper _mapper;
    private readonly RecommendationOptions _options;
    private readonly ILogger<RecommendationService> _logger;

    public RecommendationService(
      HttpClient httpClient,
      ITutorRepository tutorRepository,
      IStudentRepository studentRepository,
      ILearningRequestRepository learningRequestRepository,
      ISubjectRepository subjectRepository,
      IMapper mapper,
      IOptions<RecommendationOptions> options,
      ILogger<RecommendationService> logger)
    {
      _httpClient = httpClient;
      _tutorRepository = tutorRepository;
      _studentRepository = studentRepository;
      _learningRequestRepository = learningRequestRepository;
      _subjectRepository = subjectRepository;
      _mapper = mapper;
      _options = options.Value;
      _logger = logger;
    }

    public async Task<ApiResponse<TutorRecommendationListDto>> GetTutorRecommendationsAsync(
      long currentUserId,
      TutorRecommendationQueryParameters parameters)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var student = await _studentRepository.GetStudentDetailByUserIdAsync(currentUserId);
        if (student == null)
        {
          throw new NotFoundException("Không tìm thấy thông tin học viên.", "STUDENT_NOT_FOUND");
        }

        var rankingLimit = Math.Max(_options.RankingLimit, RecommendationTopK);
        var candidates = await _tutorRepository.GetRecommendationCandidatesAsync(parameters, rankingLimit);
        if (candidates.Count == 0)
        {
          return ApiResponse<TutorRecommendationListDto>.SuccessResult(new TutorRecommendationListDto());
        }

        var recentRequests = await _learningRequestRepository.GetRecentByStudentIdForRecommendationAsync(
          currentUserId,
          RecentLearningRequestLimit);
        var request = await BuildEngineRequestAsync(student, parameters, recentRequests, candidates, rankingLimit);

        try
        {
          var response = await _httpClient.PostAsJsonAsync("/recommendations/tutors", request);
          response.EnsureSuccessStatusCode();

          var engineResponse = await response.Content.ReadFromJsonAsync<RecommendationEngineResponse>();
          if (engineResponse == null)
          {
            throw new InvalidOperationException("Recommendation engine returned an empty response.");
          }

          var items = BuildRankedItems(candidates, engineResponse.Recommendations, student, parameters, recentRequests);
          return ApiResponse<TutorRecommendationListDto>.SuccessResult(new TutorRecommendationListDto
          {
            IsFallback = false,
            Items = items
          });
        }
        catch (Exception ex)
        {
          _logger.LogWarning(ex, "Recommendation engine failed. Falling back to popular tutor ranking.");
          return ApiResponse<TutorRecommendationListDto>.SuccessResult(new TutorRecommendationListDto
          {
            IsFallback = true,
            Items = BuildFallbackItems(candidates)
          });
        }
      });
    }

    private async Task<RecommendationEngineRequest> BuildEngineRequestAsync(
      Student student,
      TutorRecommendationQueryParameters parameters,
      List<LearningRequest> recentRequests,
      List<Tutor> candidates,
      int rankingLimit)
    {
      var subjectIds = new HashSet<long>();
      var subjectNames = new List<string>();

      if (parameters.SubjectId.HasValue)
      {
        subjectIds.Add(parameters.SubjectId.Value);
        var subject = await _subjectRepository.GetByIdAsync(parameters.SubjectId.Value);
        if (subject != null)
        {
          subjectNames.Add(subject.Name);
        }
      }

      foreach (var request in recentRequests)
      {
        subjectIds.Add(request.SubjectId);
        if (!string.IsNullOrWhiteSpace(request.Subject?.Name))
        {
          subjectNames.Add(request.Subject.Name);
        }
      }

      return new RecommendationEngineRequest
      {
        RankingLimit = rankingLimit,
        Student = new RecommendationEngineStudentDto
        {
          StudentId = student.UserId,
          GradeLevel = student.GradeLevel?.ToString(),
          SubjectIds = subjectIds.ToList(),
          SubjectNames = subjectNames.Distinct(StringComparer.OrdinalIgnoreCase).ToList(),
          LearningRequestTexts = recentRequests
            .Select(request => request.Note)
            .Where(note => !string.IsNullOrWhiteSpace(note))
            .Select(note => note!.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList(),
          SearchTerm = string.IsNullOrWhiteSpace(parameters.SearchTerm) ? null : parameters.SearchTerm.Trim()
        },
        Candidates = candidates.Select(candidate => new RecommendationEngineCandidateDto
        {
          TutorId = candidate.Id,
          SubjectIds = candidate.TutorSubjects.Select(subject => subject.SubjectId).Distinct().ToList(),
          SubjectNames = candidate.TutorSubjects
            .Select(subject => subject.Subject?.Name)
            .Where(name => !string.IsNullOrWhiteSpace(name))
            .Select(name => name!)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList(),
          TeachingLevels = candidate.TeachingLevels.Select(level => level.TeachingLevel.ToString()).Distinct().ToList(),
          Major = string.IsNullOrWhiteSpace(candidate.Major) ? null : candidate.Major.Trim(),
          Profile = string.IsNullOrWhiteSpace(candidate.Profile) ? null : candidate.Profile.Trim(),
          School = string.IsNullOrWhiteSpace(candidate.User?.School) ? null : candidate.User.School.Trim()
        }).ToList()
      };
    }

    private List<TutorRecommendationDto> BuildRankedItems(
      List<Tutor> candidates,
      List<RecommendationEngineItemDto> engineItems,
      Student student,
      TutorRecommendationQueryParameters parameters,
      List<LearningRequest> recentRequests)
    {
      var scores = engineItems.ToDictionary(item => item.TutorId, item => item.Similarity);

      return candidates
        .Where(candidate => scores.ContainsKey(candidate.Id))
        .OrderByDescending(candidate => scores[candidate.Id])
        .ThenByDescending(candidate => candidate.Rating)
        .ThenByDescending(candidate => candidate.TotalReviews)
        .ThenByDescending(candidate => candidate.CreatedAt)
        .ThenBy(candidate => candidate.Id)
        .Take(RecommendationTopK)
        .Select(candidate => new TutorRecommendationDto
        {
          Tutor = _mapper.Map<TutorDto>(candidate),
          Similarity = scores[candidate.Id],
          Reasons = BuildReasons(candidate, student, parameters, recentRequests)
        })
        .ToList();
    }

    private List<TutorRecommendationDto> BuildFallbackItems(List<Tutor> candidates)
    {
      return candidates
        .OrderByDescending(candidate => candidate.Rating)
        .ThenByDescending(candidate => candidate.TotalReviews)
        .ThenByDescending(candidate => candidate.CreatedAt)
        .ThenBy(candidate => candidate.Id)
        .Take(RecommendationTopK)
        .Select(candidate => new TutorRecommendationDto
        {
          Tutor = _mapper.Map<TutorDto>(candidate),
          Similarity = null,
          Reasons = ["Gia sư phù hợp với nhu cầu học tập của bạn"]
        })
        .ToList();
    }

    private static List<string> BuildReasons(
      Tutor tutor,
      Student student,
      TutorRecommendationQueryParameters parameters,
      List<LearningRequest> recentRequests)
    {
      var reasons = new List<string>();
      var tutorSubjects = tutor.TutorSubjects
        .Where(subject => subject.Subject != null)
        .ToList();

      var selectedSubject = parameters.SubjectId.HasValue
        ? tutorSubjects.FirstOrDefault(subject => subject.SubjectId == parameters.SubjectId.Value)
        : null;

      if (selectedSubject?.Subject != null)
      {
        reasons.Add($"Cùng môn học {selectedSubject.Subject.Name}");
      }
      else
      {
        var historicalSubjectIds = recentRequests.Select(request => request.SubjectId).ToHashSet();
        var historicalSubject = tutorSubjects.FirstOrDefault(subject => historicalSubjectIds.Contains(subject.SubjectId));
        if (historicalSubject?.Subject != null)
        {
          reasons.Add($"Phù hợp với môn {historicalSubject.Subject.Name} bạn từng học");
        }
      }

      var studentLevel = MapGradeToTeachingLevel(student.GradeLevel);
      if (studentLevel.HasValue && tutor.TeachingLevels.Any(level => level.TeachingLevel == studentLevel.Value))
      {
        reasons.Add($"Phù hợp cấp {FormatTeachingLevel(studentLevel.Value)}");
      }

      var subjectName = selectedSubject?.Subject?.Name
        ?? tutorSubjects.FirstOrDefault()?.Subject?.Name;
      if (!string.IsNullOrWhiteSpace(subjectName)
          && !string.IsNullOrWhiteSpace(tutor.Major)
          && tutor.Major.Contains(subjectName, StringComparison.OrdinalIgnoreCase))
      {
        reasons.Add($"Chuyên ngành phù hợp với môn {subjectName}");
      }

      if (!string.IsNullOrWhiteSpace(parameters.SearchTerm)
          && !string.IsNullOrWhiteSpace(tutor.Profile)
          && tutor.Profile.Contains(parameters.SearchTerm, StringComparison.OrdinalIgnoreCase))
      {
        reasons.Add("Hồ sơ có nội dung liên quan đến tìm kiếm của bạn");
      }

      if (reasons.Count == 0)
      {
        reasons.Add("Hồ sơ gia sư phù hợp với nhu cầu học tập của bạn");
      }

      return reasons.Distinct().Take(3).ToList();
    }

    private static EducationLevel? MapGradeToTeachingLevel(Grade? grade)
    {
      return grade switch
      {
        Grade.Grade0 => EducationLevel.Preschool,
        Grade.Grade1 or Grade.Grade2 or Grade.Grade3 or Grade.Grade4 or Grade.Grade5 => EducationLevel.PrimarySchool,
        Grade.Grade6 or Grade.Grade7 or Grade.Grade8 or Grade.Grade9 => EducationLevel.SecondarySchool,
        Grade.Grade10 or Grade.Grade11 or Grade.Grade12 => EducationLevel.HighSchool,
        Grade.University => EducationLevel.University,
        _ => null
      };
    }

    private static string FormatTeachingLevel(EducationLevel level)
    {
      return level switch
      {
        EducationLevel.Preschool => "mam non",
        EducationLevel.PrimarySchool => "tieu hoc",
        EducationLevel.SecondarySchool => "THCS",
        EducationLevel.HighSchool => "THPT",
        EducationLevel.College => "cao dang",
        EducationLevel.University => "dai hoc",
        _ => level.ToString()
      };
    }
  }
}

