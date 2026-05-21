using System;
using EduMatch.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EduMatch.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260521130000_AddScheduleProposal")]
    public partial class AddScheduleProposal : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ScheduleProposals",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    LearningRequestId = table.Column<long>(type: "bigint", nullable: false),
                    ProposedBy = table.Column<long>(type: "bigint", nullable: false),
                    RoundNumber = table.Column<int>(type: "integer", nullable: false),
                    TimeSlots = table.Column<string>(type: "jsonb", nullable: false),
                    DesiredStartDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    HoursPerSession = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    HourlyRate = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CalculatedDepositAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ScheduleProposals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ScheduleProposals_LearningRequests_LearningRequestId",
                        column: x => x.LearningRequestId,
                        principalTable: "LearningRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ScheduleProposals_Tutors_ProposedBy",
                        column: x => x.ProposedBy,
                        principalTable: "Tutors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleProposals_LearningRequestId",
                table: "ScheduleProposals",
                column: "LearningRequestId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleProposals_ProposedBy",
                table: "ScheduleProposals",
                column: "ProposedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ScheduleProposals_Status",
                table: "ScheduleProposals",
                column: "Status");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ScheduleProposals");
        }
    }
}
