using EduMatch.Common.Enums;
using EduMatch.Data;
using EduMatch.DTOs;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EduMatch.Repositories
{
    public class PaymentRepository : Repository<Payment>, IPaymentRepository
    {
        public PaymentRepository(AppDbContext context) : base(context)
        {
        }

        public async Task<Payment?> GetByOrderCodeAsync(long orderCode)
        {
            return await _context.Payments
                .Include(p => p.Class)
                .FirstOrDefaultAsync(p => p.OrderCode == orderCode);
        }

        public async Task<Payment?> GetByOrderCodeWithLearningRequestAsync(long orderCode)
        {
            return await _context.Payments
                .Include(p => p.LearningRequest)
                    .ThenInclude(lr => lr!.ScheduleProposal)
                .Include(p => p.LearningRequest)
                    .ThenInclude(lr => lr!.Tutor)
                .Include(p => p.Class)
                .FirstOrDefaultAsync(p => p.OrderCode == orderCode);
        }

        public async Task<Payment?> GetLatestByLearningRequestIdWithDetailsAsync(long learningRequestId)
        {
            return await _context.Payments
                .Include(p => p.LearningRequest)
                    .ThenInclude(lr => lr!.Tutor)
                .Include(p => p.Class)
                .Where(p => p.LearningRequestId == learningRequestId)
                .OrderByDescending(p => p.Status == PaymentStatus.Pending)
                .ThenByDescending(p => p.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<bool> HasPendingPaymentForLearningRequestAsync(long learningRequestId)
        {
            return await _context.Payments
                .AnyAsync(p => p.LearningRequestId == learningRequestId
                    && p.Status == Common.Enums.PaymentStatus.Pending);
        }

        public async Task<PagedResult<Payment>> GetPagedAsync(int page, int pageSize, PaymentStatus? status)
        {
            var query = _context.Payments
                .Include(p => p.Tutor)
                .Include(p => p.Class)
                .AsQueryable();

            if (status.HasValue)
            {
                query = query.Where(p => p.Status == status.Value);
            }

            var totalItems = await query.CountAsync();

            var items = await query
                .OrderByDescending(p => p.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<Payment>
            {
                Items = items,
                TotalCount = totalItems,
                Page = page,
                PageSize = pageSize,
                TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
            };
        }

        public async Task<Payment?> GetSuccessfulPaymentByClassIdAsync(long classId)
        {
            return await _context.Payments
                .Include(p => p.PaidByUser)
                .Where(p => p.ClassId == classId && p.Status == PaymentStatus.Success)
                .OrderByDescending(p => p.PaidAt ?? p.CreatedAt)
                .FirstOrDefaultAsync();
        }

        public async Task<Dictionary<long, Payment>> GetSuccessfulPaymentsByClassIdsAsync(IEnumerable<long> classIds)
        {
            var normalizedClassIds = classIds
                .Distinct()
                .ToList();

            if (normalizedClassIds.Count == 0)
            {
                return [];
            }

            var latestPayments = await _context.Payments
                .Where(p => p.ClassId.HasValue
                    && normalizedClassIds.Contains(p.ClassId.Value)
                    && p.Status == PaymentStatus.Success)
                .GroupBy(p => p.ClassId!.Value)
                .Select(group => group
                    .OrderByDescending(p => p.PaidAt ?? p.CreatedAt)
                    .First())
                .Select(p => new { p.Id, ClassId = p.ClassId!.Value })
                .ToListAsync();

            var paymentIds = latestPayments
                .Select(item => item.Id)
                .ToList();

            if (paymentIds.Count == 0)
            {
                return [];
            }

            var payments = await _context.Payments
                .Include(p => p.PaidByUser)
                .Where(p => paymentIds.Contains(p.Id))
                .ToListAsync();

            return payments.ToDictionary(p => p.ClassId!.Value);
        }
    }
}
