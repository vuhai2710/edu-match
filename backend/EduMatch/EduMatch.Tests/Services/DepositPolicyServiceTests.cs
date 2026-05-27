using EduMatch.Domain.Booking.Payments;
using EduMatch.DTOs.DepositPolicy;
using EduMatch.Repositories.Interfaces;
using EduMatch.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Moq;

namespace EduMatch.Tests.Services;

public class DepositPolicyServiceTests
{
  [Fact]
  public async Task CreatePolicyAsync_CreatesTimedPolicy_WhenDefaultPolicyExists()
  {
    var repository = new Mock<IDepositPolicyRepository>();
    repository
      .Setup(repo => repo.HasOverlapAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null))
      .ReturnsAsync(false);
    repository
      .Setup(repo => repo.AddAsync(It.IsAny<EduMatch.Models.DepositPolicy>()))
      .Returns(Task.CompletedTask);
    repository
      .Setup(repo => repo.SaveChangesAsync())
      .ReturnsAsync(1);

    var service = CreateService(repository);
    var activeFrom = DateTime.UtcNow;
    var activeTo = activeFrom.AddDays(10);

    var response = await service.CreatePolicyAsync(new UpsertDepositPolicyDto
    {
      DepositSessionCount = 2,
      DiscountPercent = 0.1m,
      ActiveFrom = activeFrom,
      ActiveTo = activeTo
    });

    Assert.True(response.Success);
    Assert.Equal(StatusCodes.Status201Created, response.StatusCode);
    repository.Verify(repo => repo.GetDefaultPolicyAsync(It.IsAny<long?>()), Times.Never);
    repository.Verify(repo => repo.AddAsync(It.Is<EduMatch.Models.DepositPolicy>(policy =>
      policy.DepositSessionCount == 2 &&
      policy.DiscountPercent == 0.1m &&
      policy.ActiveFrom == activeFrom &&
      policy.ActiveTo == activeTo)), Times.Once);
  }

  [Fact]
  public async Task CreatePolicyAsync_UpdatesDefaultPolicy_WhenNoWindowProvided()
  {
    var defaultPolicy = new EduMatch.Models.DepositPolicy
    {
      Id = 1,
      DepositSessionCount = 1,
      DiscountPercent = 0m
    };

    var repository = new Mock<IDepositPolicyRepository>();
    repository
      .Setup(repo => repo.GetDefaultPolicyAsync(null))
      .ReturnsAsync(defaultPolicy);
    repository
      .Setup(repo => repo.SaveChangesAsync())
      .ReturnsAsync(1);

    var service = CreateService(repository);

    var response = await service.CreatePolicyAsync(new UpsertDepositPolicyDto
    {
      DepositSessionCount = 3,
      DiscountPercent = 0m
    });

    Assert.True(response.Success);
    Assert.Equal(StatusCodes.Status200OK, response.StatusCode);
    Assert.NotNull(response.Data);
    Assert.Equal(3, response.Data.DepositSessionCount);
    Assert.Equal(0m, response.Data.DiscountPercent);
    repository.Verify(repo => repo.HasOverlapAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<long?>()), Times.Never);
    repository.Verify(repo => repo.AddAsync(It.IsAny<EduMatch.Models.DepositPolicy>()), Times.Never);
    repository.Verify(repo => repo.Update(defaultPolicy), Times.Once);
  }

  [Fact]
  public async Task CreatePolicyAsync_ReturnsFailResponse_WhenPolicyWindowOverlaps()
  {
    var repository = new Mock<IDepositPolicyRepository>();
    repository
      .Setup(repo => repo.HasOverlapAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null))
      .ReturnsAsync(true);

    var service = CreateService(repository);

    var response = await service.CreatePolicyAsync(new UpsertDepositPolicyDto
    {
      DepositSessionCount = 2,
      DiscountPercent = 0.1m,
      ActiveFrom = DateTime.UtcNow,
      ActiveTo = DateTime.UtcNow.AddDays(10)
    });

    Assert.False(response.Success);
    Assert.Equal(StatusCodes.Status409Conflict, response.StatusCode);
    Assert.Null(response.Data);
    Assert.Contains("trùng", response.Message, StringComparison.OrdinalIgnoreCase);
  }

  [Fact]
  public async Task CreatePolicyAsync_AllowsSameStartAndEndDate()
  {
    var repository = new Mock<IDepositPolicyRepository>();
    repository
      .Setup(repo => repo.HasOverlapAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), null))
      .ReturnsAsync(false);
    repository
      .Setup(repo => repo.AddAsync(It.IsAny<EduMatch.Models.DepositPolicy>()))
      .Returns(Task.CompletedTask);
    repository
      .Setup(repo => repo.SaveChangesAsync())
      .ReturnsAsync(1);

    var service = CreateService(repository);
    var activeDate = DateTime.UtcNow.Date;

    var response = await service.CreatePolicyAsync(new UpsertDepositPolicyDto
    {
      DepositSessionCount = 2,
      DiscountPercent = 0.1m,
      ActiveFrom = activeDate,
      ActiveTo = activeDate
    });

    Assert.True(response.Success);
    Assert.Equal(StatusCodes.Status201Created, response.StatusCode);
  }

  [Fact]
  public async Task CreatePolicyAsync_ReturnsBadRequest_WhenEndDateBeforeStartDate()
  {
    var repository = new Mock<IDepositPolicyRepository>();
    var service = CreateService(repository);
    var activeFrom = DateTime.UtcNow.Date;

    var response = await service.CreatePolicyAsync(new UpsertDepositPolicyDto
    {
      DepositSessionCount = 2,
      DiscountPercent = 0.1m,
      ActiveFrom = activeFrom,
      ActiveTo = activeFrom.AddDays(-1)
    });

    Assert.False(response.Success);
    Assert.Equal(StatusCodes.Status400BadRequest, response.StatusCode);
    repository.Verify(repo => repo.HasOverlapAsync(It.IsAny<DateTime?>(), It.IsAny<DateTime?>(), It.IsAny<long?>()), Times.Never);
  }

  [Fact]
  public async Task PreviewDepositAsync_ReturnsEmptyPreview_WhenNoActivePolicyExists()
  {
    var repository = new Mock<IDepositPolicyRepository>();
    repository
      .Setup(repo => repo.GetActivePolicyAsync())
      .ReturnsAsync((EduMatch.Models.DepositPolicy?)null);

    var service = CreateService(repository);

    var response = await service.PreviewDepositAsync(100_000m, 2m);

    Assert.True(response.Success);
    Assert.NotNull(response.Data);
    Assert.Equal(0, response.Data.DepositSessionCount);
    Assert.Equal(0m, response.Data.DiscountPercent);
    Assert.Equal(0m, response.Data.TotalAmount);
    Assert.Equal(0m, response.Data.DepositAmount);
    Assert.Equal(0m, response.Data.RemainingAmount);
  }

  [Fact]
  public async Task GetCurrentActivePolicyAsync_ReturnsNullData_WhenNoActivePolicyExists()
  {
    var repository = new Mock<IDepositPolicyRepository>();
    repository
      .Setup(repo => repo.GetActivePolicyAsync())
      .ReturnsAsync((EduMatch.Models.DepositPolicy?)null);

    var service = CreateService(repository);

    var response = await service.GetCurrentActivePolicyAsync();

    Assert.True(response.Success);
    Assert.Null(response.Data);
    Assert.Equal(StatusCodes.Status200OK, response.StatusCode);
  }

  private static DepositPolicyService CreateService(Mock<IDepositPolicyRepository> repository)
  {
    var calculator = new Mock<IDepositCalculator>();
    calculator
      .Setup(service => service.Calculate(It.IsAny<DepositCalculationRequest>()))
      .Returns(new DepositCalculationResult(0m, 0m));

    var services = new ServiceCollection();
    services.AddSingleton(calculator.Object);
    var serviceProvider = services.BuildServiceProvider();

    return new DepositPolicyService(repository.Object, serviceProvider);
  }
}
