using System;
using EduMatch.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EduMatch.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260521110000_AddLearningRequest")]
    public partial class AddLearningRequest : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LearningRequests",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    StudentId = table.Column<long>(type: "bigint", nullable: false),
                    TutorProfileId = table.Column<long>(type: "bigint", nullable: false),
                    SubjectId = table.Column<long>(type: "bigint", nullable: false),
                    Note = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    TimeSlots = table.Column<string>(type: "jsonb", nullable: false),
                    DesiredStartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HoursPerSession = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    BudgetPerHour = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CalculatedDepositAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ScheduleExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PaymentExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LearningRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LearningRequests_Subjects_SubjectId",
                        column: x => x.SubjectId,
                        principalTable: "Subjects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LearningRequests_Tutors_TutorProfileId",
                        column: x => x.TutorProfileId,
                        principalTable: "Tutors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_LearningRequests_Users_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_LearningRequests_Status",
                table: "LearningRequests",
                column: "Status");

            migrationBuilder.CreateIndex(
                name: "IX_LearningRequests_StudentId",
                table: "LearningRequests",
                column: "StudentId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningRequests_SubjectId",
                table: "LearningRequests",
                column: "SubjectId");

            migrationBuilder.CreateIndex(
                name: "IX_LearningRequests_TutorProfileId",
                table: "LearningRequests",
                column: "TutorProfileId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LearningRequests");
        }
    }
}
