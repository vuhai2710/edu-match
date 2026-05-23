using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
  public partial class RenameTutorBioToProfile : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.RenameColumn(
        name: "Bio",
        table: "Tutors",
        newName: "Profile");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.RenameColumn(
        name: "Profile",
        table: "Tutors",
        newName: "Bio");
    }
  }
}
