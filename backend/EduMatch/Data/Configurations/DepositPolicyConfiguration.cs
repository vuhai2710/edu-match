using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations;

public class DepositPolicyConfiguration : IEntityTypeConfiguration<DepositPolicy>
{
  public void Configure(EntityTypeBuilder<DepositPolicy> builder)
  {
    builder.ToTable("DepositPolicies");

    builder.HasKey(x => x.Id);
    builder.HasQueryFilter(x => !x.IsDeleted);

    builder.Property(x => x.DepositSessionCount)
      .IsRequired();

    builder.Property(x => x.DiscountPercent)
      .HasPrecision(5, 4);
  }
}
