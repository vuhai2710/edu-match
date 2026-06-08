using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.DTOs;
using EduMatch.DTOs.Review;
using EduMatch.Models;
using EduMatch.Repositories;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;

namespace EduMatch.Services;

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
        throw new NotFoundException("Khong tim thay lop hoc.");
      }

      if (classEntity.StudentId != userId)
      {
        throw new ForbiddenException("Ban khong co quyen danh gia lop hoc nay.");
      }

      if (classEntity.TutorId == 0)
      {
        throw new ValidationException("Lop hoc khong co gia su hop le.");
      }

      if (classEntity.Status is not (ClassStatus.Active or ClassStatus.Completed))
      {
        throw new ConflictException(
          "Chi duoc danh gia khi lop hoc dang hoat dong hoac da hoan thanh.",
          "REVIEW_CLASS_NOT_ELIGIBLE");
      }

      if (!classEntity.StartDate.HasValue)
      {
        throw new ValidationException(
          "Lop hoc chua co ngay bat dau hop le.",
          "REVIEW_NO_START_DATE");
      }

      if (DateTime.UtcNow < classEntity.StartDate.Value.AddDays(7))
      {
        throw new ValidationException(
          "Chi duoc phep danh gia sau 7 ngay ke tu ngay bat dau lop hoc.",
          "REVIEW_TOO_EARLY");
      }

      var alreadyReviewed = await _reviewRepository.ExistsByClassAndStudentAsync(dto.ClassId, userId);
      if (alreadyReviewed)
      {
        throw new ConflictException("Ban da danh gia lop hoc nay roi.");
      }

      var tutor = await _tutorRepository.GetByIdAsync(classEntity.TutorId);
      if (tutor == null)
      {
        throw new NotFoundException("Khong tim thay thong tin gia su.");
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
        "Danh gia moi",
        $"Hoc vien {reviewWithDetails.Student.FullName} da danh gia ban {review.Rating} sao cho lop {classEntity.Code}.",
        NotificationType.ReviewCreated,
        "Review",
        review.Id,
        $"/reviews/{review.Id}");

      return ApiResponse<ReviewDto>.SuccessResult(MapToDto(reviewWithDetails), "Danh gia thanh cong.");
    });
  }

  public async Task<ApiResponse<ReviewEligibilityDto>> GetEligibilityAsync(long userId, long classId)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
    {
      var classEntity = await _classRepository.GetByIdAsync(classId);
      if (classEntity == null)
      {
        throw new NotFoundException("Khong tim thay lop hoc.", "CLASS_NOT_FOUND");
      }

      if (classEntity.StudentId != userId)
      {
        throw new ForbiddenException("Ban khong co quyen danh gia lop hoc nay.", "REVIEW_FORBIDDEN");
      }

      var alreadyReviewed = await _reviewRepository.ExistsByClassAndStudentAsync(classId, userId);
      if (alreadyReviewed)
      {
        return ApiResponse<ReviewEligibilityDto>.SuccessResult(new ReviewEligibilityDto
        {
          ClassId = classId,
          CanReview = false,
          ReasonCode = "ALREADY_REVIEWED",
          Message = "Ban da danh gia lop hoc nay roi.",
          AlreadyReviewed = true
        });
      }

      if (classEntity.Status is not (ClassStatus.Active or ClassStatus.Completed))
      {
        return ApiResponse<ReviewEligibilityDto>.SuccessResult(new ReviewEligibilityDto
        {
          ClassId = classId,
          CanReview = false,
          ReasonCode = "NOT_ELIGIBLE_STATUS",
          Message = "Chi duoc danh gia khi lop hoc dang hoat dong hoac da hoan thanh.",
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
          Message = "Lop hoc chua co ngay bat dau hop le.",
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
          Message = "Chi duoc danh gia sau 7 ngay lop hoc bat dau.",
          AvailableAt = availableAt,
          AlreadyReviewed = false
        });
      }

      return ApiResponse<ReviewEligibilityDto>.SuccessResult(new ReviewEligibilityDto
      {
        ClassId = classId,
        CanReview = true,
        ReasonCode = "CAN_REVIEW",
        Message = "Co the danh gia lop hoc.",
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

  public async Task<ApiResponse<ReviewDto>> GetReviewByClassIdAsync(long classId)
  {
    return await ServiceResponse.ExecuteAsync(async () =>
    {
      var review = await _reviewRepository.GetByClassIdAsync(classId);
      if (review == null)
      {
        throw new NotFoundException("Khong tim thay danh gia cho lop hoc nay.", "REVIEW_NOT_FOUND");
      }
      
      return ApiResponse<ReviewDto>.SuccessResult(MapToDto(review));
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
