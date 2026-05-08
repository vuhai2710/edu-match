using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EduMatch.Migrations
{
    /// <inheritdoc />
    public partial class AddTutorRequestScheduleAndExpiry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TutorRequests_Addresses_AddressId",
                table: "TutorRequests");

            migrationBuilder.AddColumn<DateTime>(
                name: "ExpiresAt",
                table: "TutorRequests",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MinutesPerSession",
                table: "TutorRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PreferredSchedule",
                table: "TutorRequests",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SessionsPerWeek",
                table: "TutorRequests",
                type: "integer",
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Applications",
                type: "character varying(32)",
                maxLength: 32,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<bool>(
                name: "StudentAcceptedMatch",
                table: "Applications",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "TutorAcceptedMatch",
                table: "Applications",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.Sql("""
                UPDATE "TutorRequests"
                SET "Status" = 'Open'
                WHERE "Status" = 'Pending';
                """);

            migrationBuilder.Sql("""
                UPDATE "TutorRequests"
                SET "Status" = 'Assigned'
                WHERE "Status" = 'Accepted';
                """);

            migrationBuilder.Sql("""
                UPDATE "TutorRequests"
                SET "Status" = 'Closed'
                WHERE "Status" IN ('Rejected', 'Completed');
                """);

            migrationBuilder.AddForeignKey(
                name: "FK_TutorRequests_Addresses_AddressId",
                table: "TutorRequests",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TutorRequests_Addresses_AddressId",
                table: "TutorRequests");

            migrationBuilder.DropColumn(
                name: "ExpiresAt",
                table: "TutorRequests");

            migrationBuilder.DropColumn(
                name: "MinutesPerSession",
                table: "TutorRequests");

            migrationBuilder.DropColumn(
                name: "PreferredSchedule",
                table: "TutorRequests");

            migrationBuilder.DropColumn(
                name: "SessionsPerWeek",
                table: "TutorRequests");

            migrationBuilder.DropColumn(
                name: "StudentAcceptedMatch",
                table: "Applications");

            migrationBuilder.DropColumn(
                name: "TutorAcceptedMatch",
                table: "Applications");

            migrationBuilder.Sql("""
                UPDATE "TutorRequests"
                SET "Status" = 'Pending'
                WHERE "Status" = 'Open';
                """);

            migrationBuilder.Sql("""
                UPDATE "TutorRequests"
                SET "Status" = 'Accepted'
                WHERE "Status" = 'Assigned';
                """);

            migrationBuilder.Sql("""
                UPDATE "TutorRequests"
                SET "Status" = 'Completed'
                WHERE "Status" = 'Closed';
                """);

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "Applications",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(32)",
                oldMaxLength: 32);

            migrationBuilder.AddForeignKey(
                name: "FK_TutorRequests_Addresses_AddressId",
                table: "TutorRequests",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id");
        }
    }
}
