using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class NotificationConfiguration : IEntityTypeConfiguration<Notification>
  {
    public void Configure(EntityTypeBuilder<Notification> builder)
    {
      builder.HasQueryFilter(e => !e.IsDeleted);

      builder.HasIndex(n => new { n.UserId, n.IsRead });

      builder.HasOne(n => n.User)
        .WithMany(u => u.Notifications)
        .HasForeignKey(n => n.UserId)
        .OnDelete(DeleteBehavior.Cascade);
    }
  }
}
