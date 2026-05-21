using EduMatch.Common.Enums;
using EduMatch.Domain.Booking.Scheduling;
using EduMatch.DTOs.LearningRequests;
using EduMatch.DTOs.ScheduleProposals;
using EduMatch.Models;

namespace EduMatch.Mappers
{
  public static class ScheduleProposalMapper
  {
    public static ScheduleProposalDto ToDto(ScheduleProposal entity, IEnumerable<BookingTimeSlot> timeSlots)
    {
      return new ScheduleProposalDto
      {
        Id = entity.Id,
        LearningRequestId = entity.LearningRequestId,
        StudentId = entity.LearningRequest?.StudentId ?? 0,
        StudentName = entity.LearningRequest?.Student?.FullName ?? string.Empty,
        TutorProfileId = entity.LearningRequest?.TutorProfileId ?? entity.ProposedBy,
        TutorName = entity.LearningRequest?.TutorProfile?.User?.FullName ?? string.Empty,
        SubjectId = entity.LearningRequest?.SubjectId ?? 0,
        SubjectName = entity.LearningRequest?.Subject?.Name ?? string.Empty,
        ProposedBy = entity.ProposedBy,
        ProposedByName = entity.Tutor?.User?.FullName ?? entity.LearningRequest?.TutorProfile?.User?.FullName ?? string.Empty,
        RoundNumber = entity.RoundNumber,
        TimeSlots = timeSlots
          .Select(slot => new TimeSlotDto
          {
            Day = slot.Day.ToString(),
            StartTime = slot.StartTime.ToString("HH:mm"),
            EndTime = slot.EndTime.ToString("HH:mm")
          })
          .ToList(),
        DesiredStartDate = entity.DesiredStartDate,
        HoursPerSession = entity.HoursPerSession,
        HourlyRate = entity.HourlyRate,
        CalculatedDepositAmount = entity.CalculatedDepositAmount,
        Status = entity.Status,
        LearningRequestStatus = entity.LearningRequest?.Status ?? LearningRequestStatus.Pending,
        PaymentExpiresAt = entity.LearningRequest?.PaymentExpiresAt,
        CreatedAt = entity.CreatedAt,
        UpdatedAt = entity.UpdatedAt
      };
    }
  }
}
