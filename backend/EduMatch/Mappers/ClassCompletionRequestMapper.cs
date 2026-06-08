using EduMatch.Common.Enums;
using EduMatch.DTOs.ClassCompletionRequests;
using EduMatch.Models;

namespace EduMatch.Mappers;

public static class ClassCompletionRequestMapper
{
  public static ClassCompletionRequestDto ToDto(ClassCompletionRequest entity)
  {
    return new ClassCompletionRequestDto
    {
      Id = entity.Id,
      ClassId = entity.ClassId,
      ClassCode = entity.Class?.Code ?? string.Empty,
      ClassStatus = entity.Class?.Status ?? ClassStatus.Active,
      StudentId = entity.Class?.StudentId ?? 0,
      StudentName = entity.Class?.Student?.FullName ?? string.Empty,
      TutorId = entity.Class?.TutorId ?? 0,
      TutorUserId = entity.Class?.Tutor?.UserId ?? 0,
      TutorName = entity.Class?.Tutor?.User?.FullName ?? string.Empty,
      RequestedByUserId = entity.RequestedByUserId,
      RequestedByUserName = entity.RequestedByUser?.FullName ?? string.Empty,
      RequestedByRole = entity.RequestedByRole,
      Status = entity.Status,
      RespondedAt = entity.RespondedAt,
      RespondedByUserId = entity.RespondedByUserId,
      RespondedByUserName = entity.RespondedByUser?.FullName,
      RespondedByRole = entity.RespondedByRole,
      CreatedAt = entity.CreatedAt,
      UpdatedAt = entity.UpdatedAt
    };
  }
}
