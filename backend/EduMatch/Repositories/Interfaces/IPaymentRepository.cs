using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
    public interface IPaymentRepository : IRepository<Payment>
    {
        Task<Payment?> GetByOrderCodeAsync(long orderCode);
        Task<Payment?> GetByOrderCodeWithLearningRequestAsync(long orderCode);
        Task<Payment?> GetLatestByLearningRequestIdWithDetailsAsync(long learningRequestId);
        Task<bool> HasPendingPaymentForLearningRequestAsync(long learningRequestId);
        Task<PagedResult<Payment>> GetPagedAsync(int page, int pageSize, PaymentStatus? status, DateTime? fromDate, DateTime? toDate);
        Task<Payment?> GetSuccessfulPaymentByClassIdAsync(long classId);
        Task<Dictionary<long, Payment>> GetSuccessfulPaymentsByClassIdsAsync(IEnumerable<long> classIds);
        Task<PagedResult<Payment>> GetPagedByUserIdAsync(long userId, int page, int pageSize, PaymentStatus? status);
    }
}
