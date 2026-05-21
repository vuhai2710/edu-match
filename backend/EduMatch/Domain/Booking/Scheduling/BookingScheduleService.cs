using System.Globalization;
using System.Text.Json;
using EduMatch.Common.Exception;

namespace EduMatch.Domain.Booking.Scheduling;

public sealed class BookingScheduleService : IBookingScheduleService
{
  private const decimal MinimumHoursPerSession = 0.5m;
  private const decimal MaximumHoursPerSession = 3m;
  private const decimal HoursPerSessionStep = 0.5m;

  private static readonly TimeOnly WeekdayEarliestStart = new(17, 0);
  private static readonly TimeOnly WeekendEarliestStart = new(8, 0);
  private static readonly TimeOnly LatestEndTime = new(22, 30);
  private static readonly string[] AcceptedTimeFormats = ["HH:mm", "H:mm"];
  private static readonly JsonSerializerOptions TimeSlotJsonOptions = new()
  {
    PropertyNameCaseInsensitive = true
  };

  public IReadOnlyList<BookingTimeSlot> ParseAndValidate(string timeSlotsJson, decimal hoursPerSession)
  {
    if (string.IsNullOrWhiteSpace(timeSlotsJson))
    {
      throw new ValidationException(
        new Dictionary<string, string[]>
        {
          ["TimeSlots"] = ["TimeSlots không được để trống."]
        },
        "INVALID_TIME_SLOTS");
    }

    List<BookingTimeSlotInput>? timeSlots;

    try
    {
      timeSlots = JsonSerializer.Deserialize<List<BookingTimeSlotInput>>(timeSlotsJson, TimeSlotJsonOptions);
    }
    catch (JsonException)
    {
      throw new ValidationException(
        "TimeSlots phải là JSON array hợp lệ theo schema [{ day, startTime, endTime }].",
        "INVALID_TIME_SLOTS_JSON");
    }

    return Validate(timeSlots, hoursPerSession);
  }

  public IReadOnlyList<BookingTimeSlot> Validate(IEnumerable<BookingTimeSlotInput>? timeSlots, decimal hoursPerSession)
  {
    ValidateHoursPerSession(hoursPerSession);

    if (timeSlots == null)
    {
      throw new ValidationException(
        new Dictionary<string, string[]>
        {
          ["TimeSlots"] = ["TimeSlots phải là một mảng hợp lệ."]
        },
        "INVALID_TIME_SLOTS");
    }

    var errors = new Dictionary<string, List<string>>(StringComparer.OrdinalIgnoreCase);
    var normalizedSlots = new List<(int Index, BookingTimeSlot Slot)>();

    foreach (var (slotInput, index) in timeSlots.Select((slot, index) => (slot, index)))
    {
      var fieldPrefix = $"TimeSlots[{index}]";

      if (slotInput == null)
      {
        AddError(errors, fieldPrefix, "Slot không được null.");
        continue;
      }

      var hasDay = TryParseDay(slotInput.Day, out var day);
      if (!hasDay)
      {
        AddError(
          errors,
          $"{fieldPrefix}.Day",
          "Day không hợp lệ. Hỗ trợ tên thứ (Monday..Sunday) hoặc số 0..6.");
      }

      var hasStartTime = TryParseTime(slotInput.StartTime, out var startTime);
      if (!hasStartTime)
      {
        AddError(
          errors,
          $"{fieldPrefix}.StartTime",
          "StartTime không hợp lệ. Định dạng yêu cầu HH:mm.");
      }

      var hasEndTime = TryParseTime(slotInput.EndTime, out var endTime);
      if (!hasEndTime)
      {
        AddError(
          errors,
          $"{fieldPrefix}.EndTime",
          "EndTime không hợp lệ. Định dạng yêu cầu HH:mm.");
      }

      if (!hasDay || !hasStartTime || !hasEndTime)
      {
        continue;
      }

      var computedEndTime = ComputeEndTime(startTime, hoursPerSession);
      if (endTime != computedEndTime)
      {
        AddError(
          errors,
          $"{fieldPrefix}.EndTime",
          $"EndTime phải bằng StartTime + HoursPerSession ({computedEndTime:HH\\:mm}).");
      }

      var earliestStartTime = IsWeekend(day) ? WeekendEarliestStart : WeekdayEarliestStart;
      if (startTime < earliestStartTime)
      {
        AddError(
          errors,
          $"{fieldPrefix}.StartTime",
          $"StartTime phải từ {earliestStartTime:HH\\:mm} trở đi.");
      }

      if (endTime > LatestEndTime)
      {
        AddError(
          errors,
          $"{fieldPrefix}.EndTime",
          $"EndTime không được muộn hơn {LatestEndTime:HH\\:mm}.");
      }

      if (startTime >= endTime)
      {
        AddError(errors, $"{fieldPrefix}.StartTime", "StartTime phải nhỏ hơn EndTime.");
      }

      if (!HasAnyError(errors, fieldPrefix))
      {
        normalizedSlots.Add((index, new BookingTimeSlot(day, startTime, endTime)));
      }
    }

    foreach (var overlap in FindOverlaps(normalizedSlots))
    {
      AddError(
        errors,
        $"TimeSlots[{overlap.LeftIndex}]",
        $"Bị trùng lịch với TimeSlots[{overlap.RightIndex}].");

      AddError(
        errors,
        $"TimeSlots[{overlap.RightIndex}]",
        $"Bị trùng lịch với TimeSlots[{overlap.LeftIndex}].");
    }

    if (errors.Count > 0)
    {
      throw new ValidationException(
        errors.ToDictionary(
          item => item.Key,
          item => item.Value.Distinct(StringComparer.Ordinal).ToArray(),
          StringComparer.OrdinalIgnoreCase),
        "INVALID_TIME_SLOTS");
    }

    return normalizedSlots
      .OrderBy(slot => slot.Slot.Day)
      .ThenBy(slot => slot.Slot.StartTime)
      .Select(slot => slot.Slot)
      .ToArray();
  }

  public TimeOnly ComputeEndTime(TimeOnly startTime, decimal hoursPerSession)
  {
    ValidateHoursPerSession(hoursPerSession);

    var duration = TimeSpan.FromMinutes((double)(hoursPerSession * 60m));
    var endTime = startTime.Add(duration, out var wrappedDays);

    if (wrappedDays != 0)
    {
      throw new ValidationException(
        "EndTime tính ra vượt qua cuối ngày.",
        "INVALID_TIME_SLOT_RANGE");
    }

    return endTime;
  }

  public void ValidateHoursPerSession(decimal hoursPerSession, string fieldName = "HoursPerSession")
  {
    var errors = new Dictionary<string, string[]>(StringComparer.OrdinalIgnoreCase);

    if (hoursPerSession < MinimumHoursPerSession || hoursPerSession > MaximumHoursPerSession)
    {
      errors[fieldName] =
      [
        $"HoursPerSession phải nằm trong khoảng {MinimumHoursPerSession} đến {MaximumHoursPerSession} giờ."
      ];
    }
    else if (decimal.Remainder(hoursPerSession, HoursPerSessionStep) != 0)
    {
      errors[fieldName] =
      [
        $"HoursPerSession phải tăng theo bước {HoursPerSessionStep} giờ."
      ];
    }

    if (errors.Count > 0)
    {
      throw new ValidationException(errors, "INVALID_HOURS_PER_SESSION");
    }
  }

  public bool HasOverlap(BookingTimeSlot first, BookingTimeSlot second)
  {
    return first.Day == second.Day
      && first.StartTime < second.EndTime
      && second.StartTime < first.EndTime;
  }

  public bool HasAnyOverlap(IEnumerable<BookingTimeSlot> timeSlots)
  {
    var normalizedSlots = timeSlots.ToArray();

    for (var i = 0; i < normalizedSlots.Length; i++)
    {
      for (var j = i + 1; j < normalizedSlots.Length; j++)
      {
        if (HasOverlap(normalizedSlots[i], normalizedSlots[j]))
        {
          return true;
        }
      }
    }

    return false;
  }

  private static bool TryParseDay(string? dayValue, out DayOfWeek day)
  {
    if (!string.IsNullOrWhiteSpace(dayValue) && Enum.TryParse(dayValue.Trim(), true, out day))
    {
      return true;
    }

    if (!string.IsNullOrWhiteSpace(dayValue)
      && int.TryParse(dayValue.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out var numericDay)
      && numericDay >= 0
      && numericDay <= 6)
    {
      day = (DayOfWeek)numericDay;
      return true;
    }

    day = default;
    return false;
  }

  private static bool TryParseTime(string? value, out TimeOnly time)
  {
    return TimeOnly.TryParseExact(
      value?.Trim(),
      AcceptedTimeFormats,
      CultureInfo.InvariantCulture,
      DateTimeStyles.None,
      out time);
  }

  private static bool IsWeekend(DayOfWeek day)
  {
    return day is DayOfWeek.Saturday or DayOfWeek.Sunday;
  }

  private static void AddError(Dictionary<string, List<string>> errors, string key, string message)
  {
    if (!errors.TryGetValue(key, out var values))
    {
      values = [];
      errors[key] = values;
    }

    values.Add(message);
  }

  private static bool HasAnyError(Dictionary<string, List<string>> errors, string fieldPrefix)
  {
    return errors.Keys.Any(key => key.StartsWith(fieldPrefix, StringComparison.OrdinalIgnoreCase));
  }

  private IEnumerable<(int LeftIndex, int RightIndex)> FindOverlaps(
    IReadOnlyList<(int Index, BookingTimeSlot Slot)> timeSlots)
  {
    for (var i = 0; i < timeSlots.Count; i++)
    {
      for (var j = i + 1; j < timeSlots.Count; j++)
      {
        if (HasOverlap(timeSlots[i].Slot, timeSlots[j].Slot))
        {
          yield return (timeSlots[i].Index, timeSlots[j].Index);
        }
      }
    }
  }
}
