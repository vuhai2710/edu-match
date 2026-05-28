using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.DTOs;
using EduMatch.DTOs.Review;
using EduMatch.Models;
using EduMatch.Repositories;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services
{
  public class ReviewService : IReviewService
  {
    private readonly IReviewRepository _reviewRepository;
    private readonly IClassRepository _classRepository;
    private readonly ITutorRepository _tutorRepository;
    private readonly INotificationService _notificationService;

    public ReviewService(
      IReviewRepository reviewRepository,
      IClassRepository classRepository,
      ITutorRepository tutorRepository,
      INotificationService notificationService)
    {
      _reviewRepository = reviewRepository;
      _classRepository = classRepository;
      _tutorRepository = tutorRepository;
      _notificationService = notificationService;
    }

    public async Task<ApiResponse<ReviewDto>> CreateReviewAsync(long userId, CreateReviewDto dto)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var classEntity = await _classRepository.GetByIdAsync(dto.ClassId);
        if (classEntity == null)
        {
          throw new NotFoundException("KhÃ´ng tÃ¬m tháº¥y lá»›p há»c.");
        }

        if (classEntity.StudentId != userId)
        {
          throw new ForbiddenException("Báº¡n khÃ´ng cÃ³ quyá»n Ä‘Ã¡nh giÃ¡ lá»›p há»c nÃ y.");
        }

        if (classEntity.TutorId == 0)
        {
          throw new ValidationException("Lá»›p há»c khÃ´ng cÃ³ gia sÆ° há»£p lá»‡.");
        }

        if (classEntity.Status != ClassStatus.Active)
        {
          throw new ConflictException(
            "Chá»‰ Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡ khi lá»›p há»c Ä‘ang hoáº¡t Ä‘á»™ng.",
            "REVIEW_CLASS_NOT_ACTIVE");
        }

        if (!classEntity.StartDate.HasValue)
        {
          throw new ValidationException(
            "Lá»›p há»c chÆ°a cÃ³ ngÃ y báº¯t Ä‘áº§u há»£p lá»‡.",
            "REVIEW_NO_START_DATE");
        }

        if (DateTime.UtcNow < classEntity.StartDate.Value.AddDays(7))
        {
          throw new ValidationException(
            "Chá»‰ Ä‘Æ°á»£c phÃ©p Ä‘Ã¡nh giÃ¡ sau 7 ngÃ y ká»ƒ tá»« ngÃ y báº¯t Ä‘áº§u lá»›p há»c.",
            "REVIEW_TOO_EARLY");
        }

        var alreadyReviewed = await _reviewRepository.ExistsByClassAndStudentAsync(dto.ClassId, userId);
        if (alreadyReviewed)
        {
          throw new ConflictException("Báº¡n Ä‘Ã£ Ä‘Ã¡nh giÃ¡ lá»›p há»c nÃ y rá»“i.");
        }

        var tutor = await _tutorRepository.GetByIdAsync(classEntity.TutorId);
        if (tutor == null)
        {
          throw new NotFoundException("KhÃ´ng tÃ¬m tháº¥y thÃ´ng tin gia sÆ°.");
        }

        var review = new Review
        {
          ClassId = dto.ClassId,
          StudentId = userId,
          TutorId = classEntity.TutorId,
          Rating = dto.Rating,
          Comment = dto.Comment
        };

        await _reviewRepository.AddAsync(review);
        await _reviewRepository.SaveChangesAsync();

        var newAverage = await _reviewRepository.CalculateAverageRatingAsync(tutor.Id);
        var totalReviews = await _reviewRepository.CountByTutorIdAsync(tutor.Id);

        tutor.Rating = Math.Round(newAverage, 1);
        tutor.TotalReviews = totalReviews;
        _tutorRepository.Update(tutor);
        await _tutorRepository.SaveChangesAsync();

        var reviewWithDetails = (await _reviewRepository.GetByTutorIdAsync(tutor.Id)).First(r => r.Id == review.Id);

        await _notificationService.SendAsync(
          tutor.UserId,
          "ÄÃ¡nh giÃ¡ má»›i",
          $"Há»c viÃªn {reviewWithDetails.Student.FullName} Ä‘Ã£ Ä‘Ã¡nh giÃ¡ báº¡n {review.Rating} sao cho lá»›p {classEntity.Code}.",
          NotificationType.ReviewCreated,
          "Review",
          review.Id,
          $"/reviews/{review.Id}");

        return ApiResponse<ReviewDto>.SuccessResult(MapToDto(reviewWithDetails), "ÄÃ¡nh giÃ¡ thÃ nh cÃ´ng.");
      });
    }

    public async Task<ApiResponse<ReviewEligibilityDto>> GetEligibilityAsync(long userId, long classId)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var classEntity = await _classRepository.GetByIdAsync(classId);
        if (classEntity == null)
        {
          throw new NotFoundException("KhÃ´ng tÃ¬m tháº¥y lá»›p há»c.", "CLASS_NOT_FOUND");
        }

        if (classEntity.StudentId != userId)
        {
          throw new ForbiddenException("Báº¡n khÃ´ng cÃ³ quyá»n Ä‘Ã¡nh giÃ¡ lá»›p há»c nÃ y.", "REVIEW_FORBIDDEN");
        }

        var alreadyReviewed = await _reviewRepository.ExistsByClassAndStudentAsync(classId, userId);
        if (alreadyReviewed)
        {
          return ApiResponse<ReviewEligibilityDto>.SuccessResult(new ReviewEligibilityDto
          {
            ClassId = classId,
            CanReview = false,
            ReasonCode = "ALREADY_REVIEWED",
            Message = "Báº¡n Ä‘Ã£ Ä‘Ã¡nh giÃ¡ lá»›p há»c nÃ y rá»“i.",
            AlreadyReviewed = true
          });
        }

        if (classEntity.Status != ClassStatus.Active)
        {
          return ApiResponse<ReviewEligibilityDto>.SuccessResult(new ReviewEligibilityDto
          {
            ClassId = classId,
            CanReview = false,
            ReasonCode = "NOT_ACTIVE",
            Message = "Chá»‰ Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡ khi lá»›p há»c Ä‘ang hoáº¡t Ä‘á»™ng.",
            AlreadyReviewed = false
          });
        }

        if (!classEntity.StartDate.HasValue)
        {
          return ApiResponse<ReviewEligibilityDto>.SuccessResult(new ReviewEligibilityDto
          {
            ClassId = classId,
            CanReview = false,
            ReasonCode = "NO_START_DATE",
            Message = "Lá»›p há»c chÆ°a cÃ³ ngÃ y báº¯t Ä‘áº§u há»£p lá»‡.",
            AlreadyReviewed = false
          });
        }

        var availableAt = classEntity.StartDate.Value.AddDays(7);
        if (DateTime.UtcNow < availableAt)
        {
          return ApiResponse<ReviewEligibilityDto>.SuccessResult(new ReviewEligibilityDto
          {
            ClassId = classId,
            CanReview = false,
            ReasonCode = "TOO_EARLY",
            Message = "Chá»‰ Ä‘Æ°á»£c Ä‘Ã¡nh giÃ¡ sau 7 ngÃ y lá»›p há»c báº¯t Ä‘áº§u.",
            AvailableAt = availableAt,
            AlreadyReviewed = false
          });
        }

        return ApiResponse<ReviewEligibilityDto>.SuccessResult(new ReviewEligibilityDto
        {
          ClassId = classId,
          CanReview = true,
          ReasonCode = "CAN_REVIEW",
          Message = "CÃ³ thá»ƒ Ä‘Ã¡nh giÃ¡ lá»›p há»c.",
          AlreadyReviewed = false
        });
      });
    }

    public async Task<ApiResponse<List<ReviewDto>>> GetReviewsByTutorIdAsync(long tutorId)
    {
      return await ServiceResponse.ExecuteAsync(async () =>
      {
        var reviews = await _reviewRepository.GetByTutorIdAsync(tutorId);
        return ApiResponse<List<ReviewDto>>.SuccessResult(reviews.Select(MapToDto).ToList());
      });
    }

    private static ReviewDto MapToDto(Review review)
    {
      return new ReviewDto
      {
        Id = review.Id,
        ClassId = review.ClassId,
        ClassCode = review.Class?.Code ?? string.Empty,
        StudentId = review.StudentId,
        StudentName = review.Student?.FullName ?? string.Empty,
        TutorId = review.TutorId,
        TutorName = review.Tutor?.User?.FullName ?? string.Empty,
        Rating = review.Rating,
        Comment = review.Comment,
        CreatedAt = review.CreatedAt
      };
    }
  }
}
