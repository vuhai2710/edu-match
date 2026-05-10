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

      var daysSinceCreation = (DateTime.UtcNow - classEntity.CreatedAt).TotalDays;
      if (daysSinceCreation < 7)
      {
        throw new ValidationException("Chỉ được phép đánh giá sau 7 ngày kể từ khi lớp học được tạo.");
      }

      var alreadyReviewed = await _reviewRepository.ExistsByClassIdAsync(dto.ClassId);
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
