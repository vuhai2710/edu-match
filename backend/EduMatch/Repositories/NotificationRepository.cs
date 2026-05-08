using EduMatch.Data;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly AppDbContext _context;

        public NotificationRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task AddAsync(Notification notification)
        {
            await _context.Notifications.AddAsync(notification);
        }

        public async Task<int> CountUnreadAsync(long userId)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead && !n.IsDeleted)
                .CountAsync();
        }

        public async Task<Notification?> GetByIdAsync(long id)
        {
            return await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == id && !n.IsDeleted);
        }

        public async Task<List<Notification>> GetUserNotificationsAsync(long userId, int page, int pageSize)
        {
            return await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsDeleted)
                .OrderByDescending(n => n.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}