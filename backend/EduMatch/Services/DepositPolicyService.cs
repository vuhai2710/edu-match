using EduMatch.Common.Exception;
using EduMatch.Domain.Booking.Payments;
using EduMatch.DTOs.DepositPolicy;
using EduMatch.Models;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services.Interfaces;
using Microsoft.Extensions.DependencyInjection;

namespace EduMatch.Services;

public class DepositPolicyService : IDepositPolicyService
{
  private readonly IDepositPolicyRepository _depositPolicyRepository;
  private readonly IDepositCalculator _depositCalculator;

  public DepositPolicyService(
    IDepositPolicyRepository depositPolicyRepository,
    IServiceProvider serviceProvider)
  {
    _depositPolicyRepository = depositPolicyRepository;
    _depositCalculator = serviceProvider.GetRequiredService<IDepositCalculator>();
  }

  public async Task<DepositPolicyDto> GetPolicyAsync()
  {
    var policy = await _depositPolicyRepository.GetSingletonAsync();
    if (policy == null)
    {
      throw new NotFoundException("Khong tim thay chinh sach dat coc.", "DEPOSIT_POLICY_NOT_FOUND");
    }

    return MapToDto(policy);
  }

  public async Task<DepositPolicyDto> UpsertPolicyAsync(UpsertDepositPolicyDto dto)
  {
    ValidatePolicy(dto);

    var policy = await _depositPolicyRepository.GetSingletonAsync();
    if (policy == null)
    {
      policy = new DepositPolicy
      {
        DepositSessionCount = dto.DepositSessionCount,
        DiscountPercent = dto.DiscountPercent,
        ActiveFrom = dto.ActiveFrom,
        ActiveTo = dto.ActiveTo
      };

      await _depositPolicyRepository.AddAsync(policy);
    }
    else
    {
      policy.DepositSessionCount = dto.DepositSessionCount;
      policy.DiscountPercent = dto.DiscountPercent;
      policy.ActiveFrom = dto.ActiveFrom;
      policy.ActiveTo = dto.ActiveTo;

      _depositPolicyRepository.Update(policy);
    }

    await _depositPolicyRepository.SaveChangesAsync();
    return MapToDto(policy);
  }

  public async Task<DepositPreviewResponseDto> PreviewDepositAsync(decimal hourlyRate, decimal hoursPerSession)
  {
    ValidatePreviewRequest(hourlyRate, hoursPerSession);

    var policy = await _depositPolicyRepository.GetActivePolicyAsync();
    if (policy == null)
    {
      throw new NotFoundException("Khong tim thay chinh sach dat coc dang hieu luc.", "DEPOSIT_POLICY_NOT_FOUND");
    }

    var grossAmount = hourlyRate * hoursPerSession * policy.DepositSessionCount;
    var discountedTotal = decimal.Round(
      grossAmount * (1 - policy.DiscountPercent),
      2,
      MidpointRounding.AwayFromZero);

    var calculation = _depositCalculator.Calculate(new DepositCalculationRequest
    {
      TotalAmount = discountedTotal,
      FixedAmount = discountedTotal
    });

    return new DepositPreviewResponseDto
    {
      DepositSessionCount = policy.DepositSessionCount,
      DiscountPercent = policy.DiscountPercent,
      TotalAmount = calculation.TotalAmount,
      DepositAmount = calculation.DepositAmount,
      RemainingAmount = calculation.RemainingAmount
    };
  }

  private static void ValidatePolicy(UpsertDepositPolicyDto dto)
  {
    var errors = new Dictionary<string, string[]>();

    if (dto.DepositSessionCount <= 0)
    {
      errors[nameof(dto.DepositSessionCount)] = ["DepositSessionCount phai lon hon 0."];
    }

    if (dto.DiscountPercent < 0 || dto.DiscountPercent >= 1)
    {
      errors[nameof(dto.DiscountPercent)] = ["DiscountPercent phai nam trong khoang tu 0 den nho hon 1."];
    }

    if (dto.ActiveFrom.HasValue && dto.ActiveTo.HasValue && dto.ActiveTo <= dto.ActiveFrom)
    {
      errors[nameof(dto.ActiveTo)] = ["ActiveTo phai lon hon ActiveFrom."];
    }

    if (errors.Count > 0)
    {
      throw new ValidationException(errors, "INVALID_DEPOSIT_POLICY");
    }
  }

  private static void ValidatePreviewRequest(decimal hourlyRate, decimal hoursPerSession)
  {
    var errors = new Dictionary<string, string[]>();

    if (hourlyRate <= 0)
    {
      errors[nameof(hourlyRate)] = ["HourlyRate phai lon hon 0."];
    }

    if (hoursPerSession <= 0)
    {
      errors[nameof(hoursPerSession)] = ["HoursPerSession phai lon hon 0."];
    }

    if (errors.Count > 0)
    {
      throw new ValidationException(errors, "INVALID_DEPOSIT_PREVIEW");
    }
  }

  private static DepositPolicyDto MapToDto(DepositPolicy policy)
  {
    return new DepositPolicyDto
    {
      Id = policy.Id,
      DepositSessionCount = policy.DepositSessionCount,
      DiscountPercent = policy.DiscountPercent,
      ActiveFrom = policy.ActiveFrom,
      ActiveTo = policy.ActiveTo,
      CreatedAt = policy.CreatedAt,
      UpdatedAt = policy.UpdatedAt
    };
  }
}
