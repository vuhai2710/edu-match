using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface IReviewRepository : IRepository<Review>
  {
    Task<bool> ExistsByClassIdAsync(long classId);
    Task<List<Review>> GetByTutorIdAsync(long tutorId);
    Task<double> CalculateAverageRatingAsync(long tutorId);
    Task<long> CountByTutorIdAsync(long tutorId);
  }
}
