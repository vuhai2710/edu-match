using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTutorApprovalStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add column with default 1 (Approved) so existing tutors keep their access.
            // New tutors created after this migration default to 0 (Pending) at the application level.
            // Guard: only add if not already present (handles out-of-band schema changes).
            migrationBuilder.Sql(@"
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'TutorProfiles'
                          AND column_name = 'ApprovalStatus'
                    ) THEN
                        ALTER TABLE ""TutorProfiles"" ADD COLUMN ""ApprovalStatus"" integer NOT NULL DEFAULT 1;
                    END IF;
                END $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "TutorProfiles");
        }
    }
}
