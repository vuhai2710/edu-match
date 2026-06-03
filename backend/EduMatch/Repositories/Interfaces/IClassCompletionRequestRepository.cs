using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces;

public interface IClassCompletionRequestRepository : IRepository<ClassCompletionRequest>
{
  Task<bool> HasPendingRequestForClassAsync(long classId);
  Task<ClassCompletionRequest?> GetByIdWithDetailsAsync(long id);
  Task<ClassCompletionRequest?> GetLatestByClassIdWithDetailsAsync(long classId);
}
