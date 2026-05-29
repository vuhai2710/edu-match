using EduMatch.Domain.Booking.Payments;
using EduMatch.DTOs;
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

  public async Task<ApiResponse<DepositPolicyDto?>> GetCurrentActivePolicyAsync()
  {
    var policy = await _depositPolicyRepository.GetActivePolicyAsync();
    if (policy == null)
    {
      return ApiResponse<DepositPolicyDto?>.SuccessResult(
        null,
        "Chưa có chính sách đặt cọc đang hiệu lực.",
        StatusCodes.Status200OK);
    }

    return ApiResponse<DepositPolicyDto?>.SuccessResult(MapToDto(policy), statusCode: StatusCodes.Status200OK);
  }

  public async Task<ApiResponse<PagedResult<DepositPolicyDto>>> GetHistoryAsync(int page, int pageSize)
  {
    if (page < 1) page = 1;
    if (pageSize < 1) pageSize = 10;
    if (pageSize > 100) pageSize = 100;

    var (items, totalCount) = await _depositPolicyRepository.GetPagedAsync(page, pageSize);
    var result = new PagedResult<DepositPolicyDto>
    {
      Items = items.Select(MapToDto).ToList(),
      TotalCount = totalCount,
      Page = page,
      PageSize = pageSize,
      TotalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize)
    };

    return ApiResponse<PagedResult<DepositPolicyDto>>.SuccessResult(result, statusCode: StatusCodes.Status200OK);
  }

  public async Task<ApiResponse<DepositPolicyDto?>> GetPolicyByIdAsync(long id)
  {
    var policy = await _depositPolicyRepository.GetPolicyByIdAsync(id);
    if (policy == null)
    {
      return ApiResponse<DepositPolicyDto?>.Fail(
        "Không tìm thấy chính sách đặt cọc.",
        StatusCodes.Status404NotFound);
    }

    return ApiResponse<DepositPolicyDto?>.SuccessResult(MapToDto(policy), statusCode: StatusCodes.Status200OK);
  }

  public async Task<ApiResponse<DepositPolicyDto?>> CreatePolicyAsync(UpsertDepositPolicyDto dto)
  {
    var validation = ValidatePolicy(dto);
    if (validation != null)
    {
      return validation;
    }

    if (IsDefaultPolicy(dto))
    {
      var defaultPolicy = await _depositPolicyRepository.GetDefaultPolicyAsync();
      if (defaultPolicy != null)
      {
        defaultPolicy.DepositSessionCount = dto.DepositSessionCount;
        defaultPolicy.DiscountPercent = 0m;
        defaultPolicy.ActiveFrom = null;
        defaultPolicy.ActiveTo = null;
        defaultPolicy.UpdatedAt = DateTime.UtcNow;

        _depositPolicyRepository.Update(defaultPolicy);
        await _depositPolicyRepository.SaveChangesAsync();

        return ApiResponse<DepositPolicyDto?>.SuccessResult(
          MapToDto(defaultPolicy),
          "Cập nhật số buổi cọc mặc định thành công.",
          StatusCodes.Status200OK);
      }
    }
    else if (await _depositPolicyRepository.HasOverlapAsync(dto.ActiveFrom, dto.ActiveTo, null))
    {
      return ApiResponse<DepositPolicyDto?>.Fail(
        "Khoảng thời gian hiệu lực bị trùng với một chính sách khác.",
        StatusCodes.Status409Conflict);
    }

    var policy = new DepositPolicy
    {
      DepositSessionCount = dto.DepositSessionCount,
      DiscountPercent = dto.DiscountPercent,
      ActiveFrom = dto.ActiveFrom,
      ActiveTo = dto.ActiveTo
    };

    await _depositPolicyRepository.AddAsync(policy);
    await _depositPolicyRepository.SaveChangesAsync();

    return ApiResponse<DepositPolicyDto?>.SuccessResult(
      MapToDto(policy),
      "Tạo chính sách đặt cọc thành công.",
      StatusCodes.Status201Created);
  }

  public async Task<ApiResponse<DepositPolicyDto?>> UpdatePolicyAsync(long id, UpsertDepositPolicyDto dto)
  {
    var validation = ValidatePolicy(dto);
    if (validation != null)
    {
      return validation;
    }

    var policy = await _depositPolicyRepository.GetPolicyByIdAsync(id);
    if (policy == null)
    {
      return ApiResponse<DepositPolicyDto?>.Fail(
        "Không tìm thấy chính sách đặt cọc.",
        StatusCodes.Status404NotFound);
    }

    if (IsDefaultPolicy(dto))
    {
      var defaultPolicy = await _depositPolicyRepository.GetDefaultPolicyAsync(id);
      if (defaultPolicy != null)
      {
        return ApiResponse<DepositPolicyDto?>.Fail(
          "Chính sách mặc định đã tồn tại.",
          StatusCodes.Status409Conflict);
      }
    }
    else if (await _depositPolicyRepository.HasOverlapAsync(dto.ActiveFrom, dto.ActiveTo, id))
    {
      return ApiResponse<DepositPolicyDto?>.Fail(
        "Khoảng thời gian hiệu lực bị trùng với một chính sách khác.",
        StatusCodes.Status409Conflict);
    }

    policy.DepositSessionCount = dto.DepositSessionCount;
    policy.DiscountPercent = dto.DiscountPercent;
    policy.ActiveFrom = dto.ActiveFrom;
    policy.ActiveTo = dto.ActiveTo;
    policy.UpdatedAt = DateTime.UtcNow;

    _depositPolicyRepository.Update(policy);
    await _depositPolicyRepository.SaveChangesAsync();

    return ApiResponse<DepositPolicyDto?>.SuccessResult(
      MapToDto(policy),
      "Cập nhật chính sách đặt cọc thành công.",
      StatusCodes.Status200OK);
  }

  public async Task<ApiResponse> DeletePolicyAsync(long id)
  {
    var policy = await _depositPolicyRepository.GetPolicyByIdAsync(id);
    if (policy == null)
    {
      return ApiResponse.Fail(
        "Không tìm thấy chính sách đặt cọc.",
        StatusCodes.Status404NotFound);
    }

    if (policy.ActiveFrom == null && policy.ActiveTo == null)
    {
      return ApiResponse.Fail(
        "Không thể xóa chính sách mặc định của hệ thống.",
        StatusCodes.Status400BadRequest);
    }

    policy.IsDeleted = true;
    policy.UpdatedAt = DateTime.UtcNow;
    _depositPolicyRepository.Update(policy);
    await _depositPolicyRepository.SaveChangesAsync();

    return ApiResponse.Ok("Xóa chính sách đặt cọc thành công.", StatusCodes.Status200OK);
  }

  public async Task<ApiResponse<DepositPreviewResponseDto>> PreviewDepositAsync(decimal hourlyRate, decimal hoursPerSession)
  {
    var validation = ValidatePreviewRequest(hourlyRate, hoursPerSession);
    if (validation != null)
    {
      return validation;
    }

    var policy = await _depositPolicyRepository.GetActivePolicyAsync();
    if (policy == null)
    {
      return ApiResponse<DepositPreviewResponseDto>.SuccessResult(
        CreateEmptyPreview(),
        "Chưa có chính sách đặt cọc đang hiệu lực.",
        StatusCodes.Status200OK);
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

    return ApiResponse<DepositPreviewResponseDto>.SuccessResult(
      new DepositPreviewResponseDto
      {
        DepositSessionCount = policy.DepositSessionCount,
        DiscountPercent = policy.DiscountPercent,
        TotalAmount = calculation.TotalAmount,
        DepositAmount = calculation.DepositAmount,
        RemainingAmount = calculation.RemainingAmount
      },
      statusCode: StatusCodes.Status200OK);
  }

  private static DepositPreviewResponseDto CreateEmptyPreview()
  {
    return new DepositPreviewResponseDto
    {
      DepositSessionCount = 0,
      DiscountPercent = 0,
      TotalAmount = 0,
      DepositAmount = 0,
      RemainingAmount = 0
    };
  }

  private static ApiResponse<DepositPolicyDto?>? ValidatePolicy(UpsertDepositPolicyDto dto)
  {
    var messages = new List<string>();

    if (dto.DepositSessionCount <= 0)
    {
      messages.Add("DepositSessionCount phải lớn hơn 0.");
    }

    if (dto.DiscountPercent < 0 || dto.DiscountPercent >= 1)
    {
      messages.Add("DiscountPercent phải nằm trong khoảng từ 0 đến nhỏ hơn 1.");
    }

    if (IsDefaultPolicy(dto) && dto.DiscountPercent != 0)
    {
      messages.Add("Chính sách mặc định chỉ cấu hình số buổi cọc, không cấu hình giảm giá.");
    }

    if (dto.ActiveFrom.HasValue && dto.ActiveTo.HasValue && dto.ActiveTo.Value.Date < dto.ActiveFrom.Value.Date)
    {
      messages.Add("ActiveTo không được trước ActiveFrom.");
    }

    if (messages.Count == 0)
    {
      return null;
    }

    return ApiResponse<DepositPolicyDto?>.Fail(
      string.Join(" ", messages),
      StatusCodes.Status400BadRequest);
  }

  private static bool IsDefaultPolicy(UpsertDepositPolicyDto dto)
  {
    return dto.ActiveFrom == null && dto.ActiveTo == null;
  }

  private static ApiResponse<DepositPreviewResponseDto>? ValidatePreviewRequest(decimal hourlyRate, decimal hoursPerSession)
  {
    var messages = new List<string>();

    if (hourlyRate <= 0)
    {
      messages.Add("HourlyRate phải lớn hơn 0.");
    }

    if (hoursPerSession <= 0)
    {
      messages.Add("HoursPerSession phải lớn hơn 0.");
    }

    if (messages.Count == 0)
    {
      return null;
    }

    return ApiResponse<DepositPreviewResponseDto>.Fail(
      string.Join(" ", messages),
      StatusCodes.Status400BadRequest,
      CreateEmptyPreview());
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
