using System.Data;
using EduMatch.Common.Enums;
using EduMatch.Common.Exception;
using EduMatch.Data;
using EduMatch.Domain.Booking.Scheduling;
using EduMatch.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Npgsql;

namespace EduMatch.Services
{
  public class BookingOrchestrator : IBookingOrchestrator
  {
    private const string SerializationFailureSqlState = "40001";

    private readonly AppDbContext _dbContext;
    private readonly IBookingConflictService _bookingConflictService;

    public BookingOrchestrator(
      AppDbContext dbContext,
      IBookingConflictService bookingConflictService)
    {
      _dbContext = dbContext;
      _bookingConflictService = bookingConflictService;
    }

    public async Task SoftBookAsync(
      long learningRequestId,
      long tutorProfileId,
      IReadOnlyList<BookingTimeSlot> slots,
      long? scheduleProposalId = null)
    {
      await using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable);

      try
      {
        var learningRequest = await _dbContext.LearningRequests
          .FirstOrDefaultAsync(x => x.Id == learningRequestId);

        if (learningRequest == null)
        {
          throw new NotFoundException("Không tìm thấy yêu cầu học tập.", "LEARNING_REQUEST_NOT_FOUND");
        }

        if (learningRequest.TutorProfileId != tutorProfileId)
        {
          throw new ForbiddenException("Bạn không có quyền thao tác yêu cầu học tập này.", "LEARNING_REQUEST_FORBIDDEN");
        }

        if (scheduleProposalId.HasValue)
        {
          var scheduleProposal = await _dbContext.ScheduleProposals
            .Include(x => x.LearningRequest)
            .FirstOrDefaultAsync(x => x.Id == scheduleProposalId.Value);

          if (scheduleProposal == null)
          {
            throw new NotFoundException("Không tìm thấy đề xuất lịch học.", "SCHEDULE_PROPOSAL_NOT_FOUND");
          }

          if (scheduleProposal.LearningRequestId != learningRequestId)
          {
            throw new ConflictException(
              "Đề xuất lịch học không thuộc yêu cầu học tập này.",
              "SCHEDULE_PROPOSAL_LEARNING_REQUEST_MISMATCH");
          }

          if (scheduleProposal.ProposedBy != tutorProfileId)
          {
            throw new ForbiddenException("Bạn không có quyền thao tác đề xuất lịch học này.", "SCHEDULE_PROPOSAL_FORBIDDEN");
          }

          if (scheduleProposal.Status != ScheduleProposalStatus.Pending)
          {
            throw new ConflictException("Đề xuất lịch học không còn ở trạng thái chờ phản hồi.", "SCHEDULE_PROPOSAL_INVALID_STATUS");
          }

          if (scheduleProposal.LearningRequest.Status != LearningRequestStatus.Negotiating)
          {
            throw new ConflictException("Yêu cầu học tập không còn ở trạng thái thương lượng.", "LEARNING_REQUEST_INVALID_STATUS");
          }

          scheduleProposal.Status = ScheduleProposalStatus.Accepted;
          learningRequest = scheduleProposal.LearningRequest;
        }
        else if (learningRequest.Status != LearningRequestStatus.Pending)
        {
          throw new ConflictException(
            "Không thể chấp nhận yêu cầu học tập ở trạng thái hiện tại.",
            "LEARNING_REQUEST_INVALID_STATUS");
        }

        await _bookingConflictService.CheckForConflictsAsync(tutorProfileId, slots, learningRequestId);

        learningRequest.Status = LearningRequestStatus.SoftBooked;
        learningRequest.PaymentExpiresAt = DateTime.UtcNow.AddHours(24);

        await _dbContext.SaveChangesAsync();
        await transaction.CommitAsync();
      }
      catch (DbUpdateException ex) when (IsSerializationFailure(ex))
      {
        await RollbackQuietlyAsync(transaction);
        throw new ConflictException("Xung đột đặt chỗ đồng thời, vui lòng thử lại.");
      }
      catch (PostgresException ex) when (ex.SqlState == SerializationFailureSqlState)
      {
        await RollbackQuietlyAsync(transaction);
        throw new ConflictException("Xung đột đặt chỗ đồng thời, vui lòng thử lại.");
      }
      catch
      {
        await RollbackQuietlyAsync(transaction);
        throw;
      }
    }

    private static bool IsSerializationFailure(DbUpdateException exception)
    {
      return exception.InnerException is PostgresException postgresException
        && postgresException.SqlState == SerializationFailureSqlState;
    }

    private static async Task RollbackQuietlyAsync(IDbContextTransaction transaction)
    {
      try
      {
        await transaction.RollbackAsync();
      }
      catch
      {
      }
    }
  }
}
