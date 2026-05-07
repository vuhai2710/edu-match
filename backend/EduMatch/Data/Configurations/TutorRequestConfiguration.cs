using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class TutorRequestConfiguration : IEntityTypeConfiguration<TutorRequest>
  {
    public void Configure(EntityTypeBuilder<TutorRequest> builder)
    {
      builder.HasQueryFilter(e => !e.IsDeleted);


      builder.Property(x => x.BudgetMax)
        .HasColumnType("decimal(18,2)")
        .IsRequired();

      builder.Property(x => x.Note)
        .HasMaxLength(1000)
        .IsRequired(false);

      builder.Property(x => x.Status)
        .HasConversion<string>()
        .HasMaxLength(20)
        .IsRequired();

      builder.HasOne(x => x.Student)
        .WithMany()
        .HasForeignKey(x => x.StudentId)
        .OnDelete(DeleteBehavior.Cascade);

      builder.HasOne(x => x.Subject)
        .WithMany()
        .HasForeignKey(x => x.SubjectId)
        .OnDelete(DeleteBehavior.Restrict);

      builder.HasMany(x => x.Applications)
        .WithOne(x => x.TutorRequest)
        .HasForeignKey(x => x.TutorRequestId)
        .OnDelete(DeleteBehavior.Cascade);
    }
  }
}
