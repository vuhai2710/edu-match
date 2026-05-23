using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
  public partial class AddUserBirthAndSchool : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<int>(
        name: "Birth",
        table: "Users",
        type: "integer",
        nullable: true);

      migrationBuilder.AddColumn<string>(
        name: "School",
        table: "Users",
        type: "character varying(255)",
        maxLength: 255,
        nullable: true);

      migrationBuilder.Sql(
        """
        UPDATE "Users" AS u
        SET "School" = s."School"
        FROM "Students" AS s
        WHERE s."UserId" = u."Id"
          AND s."School" IS NOT NULL
          AND s."School" <> '';
        """);

      migrationBuilder.DropColumn(
        name: "School",
        table: "Students");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.AddColumn<string>(
        name: "School",
        table: "Students",
        type: "text",
        nullable: false,
        defaultValue: "");

      migrationBuilder.Sql(
        """
        UPDATE "Students" AS s
        SET "School" = COALESCE(u."School", '')
        FROM "Users" AS u
        WHERE s."UserId" = u."Id";
        """);

      migrationBuilder.DropColumn(
        name: "Birth",
        table: "Users");

      migrationBuilder.DropColumn(
        name: "School",
        table: "Users");
    }
  }
}
