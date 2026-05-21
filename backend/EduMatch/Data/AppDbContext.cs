using EduMatch.Models;
using Microsoft.EntityFrameworkCore;
using File = EduMatch.Models.File;

namespace EduMatch.Data;

public class AppDbContext : DbContext
{
  public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

  #region DbSets
  public DbSet<Application> Applications => Set<Application>();
  public DbSet<User> Users => Set<User>();
  public DbSet<Tutor> Tutors => Set<Tutor>();
  public DbSet<Student> Students => Set<Student>();
  public DbSet<TutorRequest> TutorRequests => Set<TutorRequest>();
  public DbSet<LearningRequest> LearningRequests => Set<LearningRequest>();
  public DbSet<ScheduleProposal> ScheduleProposals => Set<ScheduleProposal>();
  public DbSet<Message> Messages => Set<Message>();
  public DbSet<Notification> Notifications => Set<Notification>();
  public DbSet<Subject> Subjects => Set<Subject>();
  public DbSet<TutorSubject> TutorSubjects => Set<TutorSubject>();
  public DbSet<TutorTeachingLevel> TutorTeachingLevels => Set<TutorTeachingLevel>();
  public DbSet<Address> Addresses => Set<Address>();
  public DbSet<File> Files => Set<File>();
  public DbSet<Class> Classes => Set<Class>();
  public DbSet<Payment> Payments => Set<Payment>();
  public DbSet<PasswordResetToken> PasswordResetTokens => Set<PasswordResetToken>();
  public DbSet<DepositPolicy> DepositPolicies => Set<DepositPolicy>();
  public DbSet<Review> Reviews => Set<Review>();
  #endregion

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    base.OnModelCreating(modelBuilder);

    modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
  }

  #region Auto set UpdatedAt on SaveChanges
  public override int SaveChanges()
  {
    SetTimestamps();
    return base.SaveChanges();
  }

  public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
  {
    SetTimestamps();
    return base.SaveChangesAsync(cancellationToken);
  }

  private void SetTimestamps()
  {
    var entries = ChangeTracker.Entries<BaseEntity>();
    foreach (var entry in entries)
    {
      if (entry.State == EntityState.Modified)
        entry.Entity.UpdatedAt = DateTime.UtcNow;
    }
  }
  #endregion
}
