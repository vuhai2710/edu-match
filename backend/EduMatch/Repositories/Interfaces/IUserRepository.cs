using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
  public interface IUserRepository : IRepository<User>
  {
    Task<User?> GetByEmailAsync(string email);
    Task<(IEnumerable<User>, int)> GetUsersWithPaginationAsync(int pageNumber, int pageSize);
  }
}
