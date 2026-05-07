using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface IUserRepository : IRepository<User>
  {
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByEmailWithProfilesAsync(string email);
    Task<User?> GetByIdWithProfilesAsync(long id);
    Task<(IEnumerable<User>, int)> GetUsersWithPaginationAsync(int pageNumber, int pageSize);
  }
}
