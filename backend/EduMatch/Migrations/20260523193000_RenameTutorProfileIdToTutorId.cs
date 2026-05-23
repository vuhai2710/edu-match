using EduMatch.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
  [DbContext(typeof(AppDbContext))]
  [Migration("20260523193000_RenameTutorProfileIdToTutorId")]
  public partial class RenameTutorProfileIdToTutorId : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
        name: "FK_LearningRequests_Tutors_TutorProfileId",
        table: "LearningRequests");

      migrationBuilder.RenameColumn(
        name: "TutorProfileId",
        table: "LearningRequests",
        newName: "TutorId");

      migrationBuilder.RenameIndex(
        name: "IX_LearningRequests_TutorProfileId",
        table: "LearningRequests",
        newName: "IX_LearningRequests_TutorId");

      migrationBuilder.AddForeignKey(
        name: "FK_LearningRequests_Tutors_TutorId",
        table: "LearningRequests",
        column: "TutorId",
        principalTable: "Tutors",
        principalColumn: "Id",
        onDelete: ReferentialAction.Restrict);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropForeignKey(
        name: "FK_LearningRequests_Tutors_TutorId",
        table: "LearningRequests");

      migrationBuilder.RenameColumn(
        name: "TutorId",
        table: "LearningRequests",
        newName: "TutorProfileId");

      migrationBuilder.RenameIndex(
        name: "IX_LearningRequests_TutorId",
        table: "LearningRequests",
        newName: "IX_LearningRequests_TutorProfileId");

      migrationBuilder.AddForeignKey(
        name: "FK_LearningRequests_Tutors_TutorProfileId",
        table: "LearningRequests",
        column: "TutorProfileId",
        principalTable: "Tutors",
        principalColumn: "Id",
        onDelete: ReferentialAction.Restrict);
    }
  }
}
