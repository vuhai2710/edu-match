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
                .AsNoTracking()
                .Include(p => p.PaidByUser)
                .Where(p => p.ClassId == classId && p.Status == PaymentStatus.Success)
                .OrderByDescending(p => p.PaidAt ?? p.CreatedAt)
                .ThenByDescending(p => p.Id)
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

            var paymentRows = await _context.Payments
                .AsNoTracking()
                .Where(p => p.ClassId.HasValue
                    && normalizedClassIds.Contains(p.ClassId.Value)
                    && p.Status == PaymentStatus.Success)
                .OrderByDescending(p => p.PaidAt ?? p.CreatedAt)
                .ThenByDescending(p => p.Id)
                .Select(p => new
                {
                    p.Id,
                    ClassId = p.ClassId!.Value,
                    p.PaidByUserId,
                    PaidByUserName = p.PaidByUser != null ? p.PaidByUser.FullName : null,
                    p.Amount,
                    p.Status,
                    p.PaidAt
                })
                .ToListAsync();

            if (paymentRows.Count == 0)
            {
                return [];
            }

            return paymentRows
                .GroupBy(row => row.ClassId)
                .ToDictionary(
                    group => group.Key,
                    group =>
                    {
                        var latestPayment = group.First();
                        return new Payment
                        {
                            Id = latestPayment.Id,
                            ClassId = latestPayment.ClassId,
                            PaidByUserId = latestPayment.PaidByUserId,
                            PaidByUser = latestPayment.PaidByUserName == null
                                ? null
                                : new User
                                {
                                    FullName = latestPayment.PaidByUserName
                                },
                            Amount = latestPayment.Amount,
                            Status = latestPayment.Status,
                            PaidAt = latestPayment.PaidAt
                        };
                    });
        }
    }
}
