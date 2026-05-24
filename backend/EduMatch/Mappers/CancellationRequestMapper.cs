using EduMatch.DTOs.CancellationRequests;
using EduMatch.Models;

namespace EduMatch.Mappers
{
  public static class CancellationRequestMapper
  {
    public static CancellationRequestDto ToDto(CancellationRequest entity)
    {
      return new CancellationRequestDto
      {
        Id = entity.Id,
        ClassId = entity.ClassId,
        ClassCode = entity.Class?.Code ?? string.Empty,
        ClassStatus = entity.Class?.Status ?? default,
        StudentId = entity.Class?.StudentId ?? 0,
        StudentName = entity.Class?.Student?.FullName ?? string.Empty,
        TutorId = entity.Class?.TutorId ?? 0,
        TutorUserId = entity.Class?.Tutor?.UserId ?? 0,
        TutorName = entity.Class?.Tutor?.User?.FullName ?? string.Empty,
        RequestedByUserId = entity.RequestedByUserId,
        RequestedByUserName = entity.RequestedByUser?.FullName ?? string.Empty,
        RequestedByRole = entity.RequestedByRole,
        Reason = entity.Reason,
        Status = entity.Status,
        RefundAmount = entity.RefundAmount,
        RefundNote = entity.RefundNote,
        IsRefunded = entity.IsRefunded,
        ResolvedAt = entity.ResolvedAt,
        ResolvedByUserId = entity.ResolvedByUserId,
        ResolvedByUserName = entity.ResolvedByUser?.FullName,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt
      };
    }
  }
}
