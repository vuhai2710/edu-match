using EduMatch.Data;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace EduMatch.Repositories
{
  public class Repository<T> : IRepository<T> where T : class
  {
    protected readonly AppDbContext _context;
    protected readonly DbSet<T> _dbSet;

    public Repository(AppDbContext context)
    {
      _context = context;
      _dbSet = _context.Set<T>();
    }

    public virtual async Task<T?> GetByIdAsync(long id)
    {
      return await _dbSet.FindAsync(id);
    }

    public virtual async Task<IEnumerable<T>> GetAllAsync()
    {
      return await _dbSet.ToListAsync();
    }

    public virtual async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
      return await _dbSet.Where(predicate).ToListAsync();
    }

    public virtual async Task AddAsync(T entity)
    {
      await _dbSet.AddAsync(entity);
    }

    public virtual async Task AddRangeAsync(IEnumerable<T> entities)
    {
      await _dbSet.AddRangeAsync(entities);
    }

    public virtual void Update(T entity)
    {
      _dbSet.Update(entity);
    }

    public virtual void Remove(T entity)
    {
      _dbSet.Remove(entity);
    }

    public virtual void RemoveRange(IEnumerable<T> entities)
    {
      _dbSet.RemoveRange(entities);
    }

    public virtual async Task<bool> ExistsAsync(Expression<Func<T, bool>> predicate)
    {
      return await _dbSet.AnyAsync(predicate);
    }

    public virtual async Task<int> SaveChangesAsync()
    {
      return await _context.SaveChangesAsync();
    }
  }
}
