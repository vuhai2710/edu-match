using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class PasswordResetTokenConfiguration : IEntityTypeConfiguration<PasswordResetToken>
  {
    public void Configure(EntityTypeBuilder<PasswordResetToken> builder)
    {
      builder.HasQueryFilter(e => !e.IsDeleted);

      builder.HasIndex(t => t.TokenHash).IsUnique();

      builder.Property(t => t.TokenHash)
        .HasMaxLength(128)
        .IsRequired();

      builder.Property(t => t.ExpiresAt)
        .IsRequired();

      builder.HasOne(t => t.User)
        .WithMany(u => u.PasswordResetTokens)
        .HasForeignKey(t => t.UserId)
        .OnDelete(DeleteBehavior.Cascade);
    }
  }
}
