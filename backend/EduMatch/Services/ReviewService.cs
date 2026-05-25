using EduMatch.Common.Enums;
using EduMatch.DTOs.Review;
using EduMatch.Common.Exception;
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

    public async Task<ReviewDto> CreateReviewAsync(long userId, CreateReviewDto dto)
    {
      var classEntity = await _classRepository.GetByIdAsync(dto.ClassId);
      if (classEntity == null)
      {
        throw new NotFoundException("Không tìm thấy lớp học.");
      }

      if (classEntity.StudentId != userId)
      {
        throw new ForbiddenException("Bạn không có quyền đánh giá lớp học này.");
      }

      if (classEntity.TutorId == 0)
      {
        throw new ValidationException("Lớp học không có gia sư hợp lệ.");
      }

      if (classEntity.Status != ClassStatus.Active)
      {
        throw new ConflictException(
          "Chỉ được đánh giá khi lớp học đang hoạt động.",
          "REVIEW_CLASS_NOT_ACTIVE");
      }

      if (!classEntity.StartDate.HasValue)
      {
        throw new ValidationException(
          "Lớp học chưa có ngày bắt đầu hợp lệ.",
          "REVIEW_NO_START_DATE");
      }

      if (DateTime.UtcNow < classEntity.StartDate.Value.AddDays(7))
      {
        throw new ValidationException(
          "Chỉ được phép đánh giá sau 7 ngày kể từ ngày bắt đầu lớp học.",
          "REVIEW_TOO_EARLY");
      }

      var alreadyReviewed = await _reviewRepository.ExistsByClassAndStudentAsync(dto.ClassId, userId);
      if (alreadyReviewed)
      {
        throw new ConflictException("Bạn đã đánh giá lớp học này rồi.");
      }

      var tutor = await _tutorRepository.GetByIdAsync(classEntity.TutorId);
      if (tutor == null)
      {
        throw new NotFoundException("Không tìm thấy thông tin gia sư.");
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
        "Đánh giá mới",
        $"Học viên {reviewWithDetails.Student.FullName} đã đánh giá bạn {review.Rating} sao cho lớp {classEntity.Code}.",
        NotificationType.ReviewCreated,
        "Review",
        review.Id,
        $"/reviews/{review.Id}"
      );

      return MapToDto(reviewWithDetails);
    }

    public async Task<ReviewEligibilityDto> GetEligibilityAsync(long userId, long classId)
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
        return new ReviewEligibilityDto
        {
          ClassId = classId,
          CanReview = false,
          ReasonCode = "ALREADY_REVIEWED",
          Message = "Ban da danh gia lop hoc nay roi.",
          AlreadyReviewed = true
        };
      }

      if (classEntity.Status != ClassStatus.Active)
      {
        return new ReviewEligibilityDto
        {
          ClassId = classId,
          CanReview = false,
          ReasonCode = "NOT_ACTIVE",
          Message = "Chi duoc danh gia khi lop hoc dang hoat dong.",
          AlreadyReviewed = false
        };
      }

      if (!classEntity.StartDate.HasValue)
      {
        return new ReviewEligibilityDto
        {
          ClassId = classId,
          CanReview = false,
          ReasonCode = "NO_START_DATE",
          Message = "Lop hoc chua co ngay bat dau hop le.",
          AlreadyReviewed = false
        };
      }

      var availableAt = classEntity.StartDate.Value.AddDays(7);
      if (DateTime.UtcNow < availableAt)
      {
        return new ReviewEligibilityDto
        {
          ClassId = classId,
          CanReview = false,
          ReasonCode = "TOO_EARLY",
          Message = "Chi duoc phep danh gia sau 7 ngay ke tu ngay bat dau lop hoc.",
          AvailableAt = availableAt,
          AlreadyReviewed = false
        };
      }

      return new ReviewEligibilityDto
      {
        ClassId = classId,
        CanReview = true,
        ReasonCode = "CAN_REVIEW",
        Message = "Co the danh gia lop hoc.",
        AlreadyReviewed = false
      };
    }

    public async Task<List<ReviewDto>> GetReviewsByTutorIdAsync(long tutorId)
    {
      var reviews = await _reviewRepository.GetByTutorIdAsync(tutorId);
      return reviews.Select(MapToDto).ToList();
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
