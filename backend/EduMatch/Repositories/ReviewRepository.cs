using EduMatch.Data;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
  public class ReviewRepository : Repository<Review>, IReviewRepository
  {
    public ReviewRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<bool> ExistsByClassIdAsync(long classId)
    {
      return await _dbSet.AnyAsync(r => r.ClassId == classId);
    }

    public async Task<List<Review>> GetByTutorIdAsync(long tutorId)
    {
      return await _dbSet
        .Include(r => r.Class)
        .Include(r => r.Student)
        .Include(r => r.Tutor)
          .ThenInclude(t => t.User)
        .Where(r => r.TutorId == tutorId)
        .OrderByDescending(r => r.CreatedAt)
        .ToListAsync();
    }

    public async Task<double> CalculateAverageRatingAsync(long tutorId)
    {
      var hasReviews = await _dbSet.AnyAsync(r => r.TutorId == tutorId);
      if (!hasReviews) return 0;
      
      return await _dbSet
        .Where(r => r.TutorId == tutorId)
        .AverageAsync(r => r.Rating);
    }

    public async Task<long> CountByTutorIdAsync(long tutorId)
    {
      return await _dbSet.CountAsync(r => r.TutorId == tutorId);
    }
  }
}
