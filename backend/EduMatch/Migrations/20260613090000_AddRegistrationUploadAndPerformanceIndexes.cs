using EduMatch.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
  [DbContext(typeof(AppDbContext))]
  [Migration("20260613090000_AddRegistrationUploadAndPerformanceIndexes")]
  public partial class AddRegistrationUploadAndPerformanceIndexes : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<DateTime>(
        name: "ExpiresAt",
        table: "Files",
        type: "timestamp with time zone",
        nullable: true);

      migrationBuilder.AddColumn<bool>(
        name: "IsTemporary",
        table: "Files",
        type: "boolean",
        nullable: false,
        defaultValue: false);

      migrationBuilder.AddColumn<string>(
        name: "UploadToken",
        table: "Files",
        type: "character varying(128)",
        maxLength: 128,
        nullable: true);

      migrationBuilder.AddColumn<DateTime>(
        name: "UsedAt",
        table: "Files",
        type: "timestamp with time zone",
        nullable: true);

      migrationBuilder.CreateIndex(
        name: "IX_Addresses_ProvinceId_WardCode",
        table: "Addresses",
        columns: new[] { "ProvinceId", "WardCode" });

      migrationBuilder.CreateIndex(
        name: "IX_Files_IsTemporary_ExpiresAt",
        table: "Files",
        columns: new[] { "IsTemporary", "ExpiresAt" });

      migrationBuilder.CreateIndex(
        name: "IX_Files_UploadToken",
        table: "Files",
        column: "UploadToken");

      migrationBuilder.CreateIndex(
        name: "IX_Messages_ReceiverId_IsRead",
        table: "Messages",
        columns: new[] { "ReceiverId", "IsRead" });

      migrationBuilder.CreateIndex(
        name: "IX_Tutors_ApprovalStatus_CreatedAt",
        table: "Tutors",
        columns: new[] { "ApprovalStatus", "CreatedAt" });

      migrationBuilder.CreateIndex(
        name: "IX_Tutors_HourlyRate",
        table: "Tutors",
        column: "HourlyRate");

      migrationBuilder.CreateIndex(
        name: "IX_Tutors_Rating",
        table: "Tutors",
        column: "Rating");

      migrationBuilder.CreateIndex(
        name: "IX_TutorSubjects_SubjectId_TutorId",
        table: "TutorSubjects",
        columns: new[] { "SubjectId", "TutorId" });

      migrationBuilder.CreateIndex(
        name: "IX_Users_RefreshToken",
        table: "Users",
        column: "RefreshToken");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropIndex(name: "IX_Addresses_ProvinceId_WardCode", table: "Addresses");
      migrationBuilder.DropIndex(name: "IX_Files_IsTemporary_ExpiresAt", table: "Files");
      migrationBuilder.DropIndex(name: "IX_Files_UploadToken", table: "Files");
      migrationBuilder.DropIndex(name: "IX_Messages_ReceiverId_IsRead", table: "Messages");
      migrationBuilder.DropIndex(name: "IX_Tutors_ApprovalStatus_CreatedAt", table: "Tutors");
      migrationBuilder.DropIndex(name: "IX_Tutors_HourlyRate", table: "Tutors");
      migrationBuilder.DropIndex(name: "IX_Tutors_Rating", table: "Tutors");
      migrationBuilder.DropIndex(name: "IX_TutorSubjects_SubjectId_TutorId", table: "TutorSubjects");
      migrationBuilder.DropIndex(name: "IX_Users_RefreshToken", table: "Users");

      migrationBuilder.DropColumn(name: "ExpiresAt", table: "Files");
      migrationBuilder.DropColumn(name: "IsTemporary", table: "Files");
      migrationBuilder.DropColumn(name: "UploadToken", table: "Files");
      migrationBuilder.DropColumn(name: "UsedAt", table: "Files");
    }
  }
}
