using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace EduMatch.Data.Configurations
{
  public class MessageConfiguration : IEntityTypeConfiguration<Message>
  {
    public void Configure(EntityTypeBuilder<Message> builder)
    {
      builder.HasQueryFilter(e => !e.IsDeleted);

      builder.HasIndex(m => new { m.SenderId, m.ReceiverId });

      builder.HasOne(m => m.Sender)
        .WithMany(u => u.SentMessages)
        .HasForeignKey(m => m.SenderId)
        .OnDelete(DeleteBehavior.Restrict);

      builder.HasOne(m => m.Receiver)
        .WithMany(u => u.ReceivedMessages)
        .HasForeignKey(m => m.ReceiverId)
        .OnDelete(DeleteBehavior.Restrict);
    }
  }
}
