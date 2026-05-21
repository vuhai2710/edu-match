using EduMatch.Domain.Booking.Scheduling;
using EduMatch.DTOs.LearningRequests;
using EduMatch.Models;

namespace EduMatch.Mappers
{
  public static class LearningRequestMapper
  {
    public static LearningRequestDto ToDto(LearningRequest request, IEnumerable<BookingTimeSlot> timeSlots)
    {
      return new LearningRequestDto
      {
        Id = request.Id,
        StudentId = request.StudentId,
        StudentName = request.Student?.FullName ?? string.Empty,
        TutorProfileId = request.TutorProfileId,
        TutorName = request.TutorProfile?.User?.FullName ?? string.Empty,
        SubjectId = request.SubjectId,
        SubjectName = request.Subject?.Name ?? string.Empty,
        Note = request.Note,
        TimeSlots = timeSlots
          .Select(slot => new TimeSlotDto
          {
            Day = slot.Day.ToString(),
            StartTime = slot.StartTime.ToString("HH:mm"),
            EndTime = slot.EndTime.ToString("HH:mm")
          })
          .ToList(),
        DesiredStartDate = request.DesiredStartDate,
        HoursPerSession = request.HoursPerSession,
        BudgetPerHour = request.BudgetPerHour,
        CalculatedDepositAmount = request.CalculatedDepositAmount,
        ScheduleExpiresAt = request.ScheduleExpiresAt,
        PaymentExpiresAt = request.PaymentExpiresAt,
        Status = request.Status,
        CreatedAt = request.CreatedAt
      };
    }
  }
}
