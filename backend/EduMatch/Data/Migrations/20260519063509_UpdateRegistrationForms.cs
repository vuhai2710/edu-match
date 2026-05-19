using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EduMatch.Data.Migrations
{
    /// <inheritdoc />
    public partial class UpdateRegistrationForms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApprovalStatus",
                table: "Tutors");

            migrationBuilder.AddColumn<string>(
                name: "AcademicDegree",
                table: "Tutors",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CareerStatus",
                table: "Tutors",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Major",
                table: "Tutors",
                type: "character varying(255)",
                maxLength: 255,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TutorTeachingLevels",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    TutorId = table.Column<long>(type: "bigint", nullable: false),
                    TeachingLevel = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TutorTeachingLevels", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TutorTeachingLevels_Tutors_TutorId",
                        column: x => x.TutorId,
                        principalTable: "Tutors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TutorTeachingLevels_TutorId_TeachingLevel",
                table: "TutorTeachingLevels",
                columns: new[] { "TutorId", "TeachingLevel" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TutorTeachingLevels");

            migrationBuilder.DropColumn(
                name: "AcademicDegree",
                table: "Tutors");

            migrationBuilder.DropColumn(
                name: "CareerStatus",
                table: "Tutors");

            migrationBuilder.DropColumn(
                name: "Major",
                table: "Tutors");

            migrationBuilder.AddColumn<int>(
                name: "ApprovalStatus",
                table: "Tutors",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }
    }
}
