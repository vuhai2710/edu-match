using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class ScheduleProposalConfiguration : IEntityTypeConfiguration<ScheduleProposal>
  {
    public void Configure(EntityTypeBuilder<ScheduleProposal> builder)
    {
      builder.HasQueryFilter(x => !x.IsDeleted);

      builder.Property(x => x.TimeSlots)
        .HasColumnType("jsonb")
        .IsRequired();

      builder.Property(x => x.HoursPerSession)
        .HasColumnType("decimal(5,2)")
        .IsRequired();

      builder.Property(x => x.HourlyRate)
        .HasColumnType("decimal(18,2)")
        .IsRequired();

      builder.Property(x => x.CalculatedDepositAmount)
        .HasColumnType("decimal(18,2)")
        .IsRequired();

      builder.Property(x => x.Status)
        .HasConversion<string>()
        .HasMaxLength(32)
        .IsRequired();

      builder.HasIndex(x => x.LearningRequestId)
        .IsUnique();

      builder.HasIndex(x => x.Status);

      builder.HasOne(x => x.LearningRequest)
        .WithOne(x => x.ScheduleProposal)
        .HasForeignKey<ScheduleProposal>(x => x.LearningRequestId)
        .OnDelete(DeleteBehavior.Cascade);

      builder.HasOne(x => x.Tutor)
        .WithMany()
        .HasForeignKey(x => x.ProposedBy)
        .OnDelete(DeleteBehavior.Restrict);
    }
  }
}
