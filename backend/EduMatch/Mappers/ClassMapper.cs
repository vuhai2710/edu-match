using EduMatch.Domain.Booking.Scheduling;
using EduMatch.DTOs.Classes;
using EduMatch.DTOs.LearningRequests;
using EduMatch.Models;

namespace EduMatch.Mappers;

public static class ClassMapper
{
  public static ClassDto ToDto(Class entity, IEnumerable<BookingTimeSlot> timeSlots, Payment? payment = null)
  {
    return new ClassDto
    {
      Id = entity.Id,
      Code = entity.Code,
      StudentId = entity.StudentId,
      StudentName = entity.Student?.FullName ?? string.Empty,
      TutorId = entity.TutorId,
      TutorName = entity.Tutor?.User?.FullName ?? string.Empty,
      SubjectId = entity.SubjectId,
      SubjectName = entity.Subject?.Name ?? string.Empty,
      StartDate = entity.StartDate,
      EndDate = entity.EndDate,
      TimeSlots = timeSlots
        .Select(slot => new TimeSlotDto
        {
          Day = slot.Day.ToString(),
          StartTime = slot.StartTime.ToString("HH:mm"),
          EndTime = slot.EndTime.ToString("HH:mm")
        })
        .ToList(),
      AcceptedScheduleSource = entity.AcceptedScheduleSource,
      DepositAmountSnapshot = entity.DepositAmountSnapshot,
      Status = entity.Status,
      PaymentSummary = payment == null
        ? null
        : new ClassPaymentSummaryDto
        {
          PaymentId = payment.Id,
          PaidByUserId = payment.PaidByUserId,
          PaidByUserName = payment.PaidByUser?.FullName,
          Amount = payment.Amount,
          Status = payment.Status,
          PaidAt = payment.PaidAt
        },
      CreatedAt = entity.CreatedAt
    };
  }
}
