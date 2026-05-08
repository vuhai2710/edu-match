using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EduMatch.Migrations
{
    /// <inheritdoc />
    public partial class AddFileTableAndTutorCvFK : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Applications_TutorProfiles_TutorProfileId",
                table: "Applications");

            migrationBuilder.DropForeignKey(
                name: "FK_TutorSubjects_TutorProfiles_TutorProfileId",
                table: "TutorSubjects");

            migrationBuilder.DropColumn(
                name: "Latitude",
                table: "Addresses");

            migrationBuilder.DropColumn(
                name: "Longitude",
                table: "Addresses");

            migrationBuilder.RenameColumn(
                name: "TutorProfileId",
                table: "TutorSubjects",
                newName: "TutorId");

            migrationBuilder.RenameIndex(
                name: "IX_TutorSubjects_TutorProfileId_SubjectId",
                table: "TutorSubjects",
                newName: "IX_TutorSubjects_TutorId_SubjectId");

            migrationBuilder.RenameColumn(
                name: "TutorProfileId",
                table: "Applications",
                newName: "TutorId");

            migrationBuilder.RenameIndex(
                name: "IX_Applications_TutorProfileId_TutorRequestId",
                table: "Applications",
                newName: "IX_Applications_TutorId_TutorRequestId");

            migrationBuilder.AddColumn<long>(
                name: "CvFileId",
                table: "TutorProfiles",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Files",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FileName = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    FileSize = table.Column<long>(type: "bigint", nullable: false),
                    ContentType = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    FileType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    FilePath = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Files", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TutorProfiles_CvFileId",
                table: "TutorProfiles",
                column: "CvFileId",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Applications_TutorProfiles_TutorId",
                table: "Applications",
                column: "TutorId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TutorProfiles_Files_CvFileId",
                table: "TutorProfiles",
                column: "CvFileId",
                principalTable: "Files",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TutorSubjects_TutorProfiles_TutorId",
                table: "TutorSubjects",
                column: "TutorId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Applications_TutorProfiles_TutorId",
                table: "Applications");

            migrationBuilder.DropForeignKey(
                name: "FK_TutorProfiles_Files_CvFileId",
                table: "TutorProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_TutorSubjects_TutorProfiles_TutorId",
                table: "TutorSubjects");

            migrationBuilder.DropTable(
                name: "Files");

            migrationBuilder.DropIndex(
                name: "IX_TutorProfiles_CvFileId",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "CvFileId",
                table: "TutorProfiles");

            migrationBuilder.RenameColumn(
                name: "TutorId",
                table: "TutorSubjects",
                newName: "TutorProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_TutorSubjects_TutorId_SubjectId",
                table: "TutorSubjects",
                newName: "IX_TutorSubjects_TutorProfileId_SubjectId");

            migrationBuilder.RenameColumn(
                name: "TutorId",
                table: "Applications",
                newName: "TutorProfileId");

            migrationBuilder.RenameIndex(
                name: "IX_Applications_TutorId_TutorRequestId",
                table: "Applications",
                newName: "IX_Applications_TutorProfileId_TutorRequestId");

            migrationBuilder.AddColumn<double>(
                name: "Latitude",
                table: "Addresses",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddColumn<double>(
                name: "Longitude",
                table: "Addresses",
                type: "double precision",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Applications_TutorProfiles_TutorProfileId",
                table: "Applications",
                column: "TutorProfileId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_TutorSubjects_TutorProfiles_TutorProfileId",
                table: "TutorSubjects",
                column: "TutorProfileId",
                principalTable: "TutorProfiles",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
