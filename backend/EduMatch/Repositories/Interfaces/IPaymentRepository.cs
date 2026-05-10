using EduMatch.Common.Enums;
using EduMatch.DTOs;
using EduMatch.Models;

namespace EduMatch.Repositories.Interfaces
{
    public interface IPaymentRepository : IRepository<Payment>
    {
        Task<Payment?> GetByOrderCodeAsync(long orderCode);
        Task<PagedResult<Payment>> GetPagedAsync(int page, int pageSize, PaymentStatus? status);
    }
}