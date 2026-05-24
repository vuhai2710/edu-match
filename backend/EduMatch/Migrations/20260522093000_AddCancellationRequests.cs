using System;
using EduMatch.Data;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EduMatch.Migrations
{
  [DbContext(typeof(AppDbContext))]
  [Migration("20260522093000_AddCancellationRequests")]
  public partial class AddCancellationRequests : Migration
  {
    protected override void Up(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.CreateTable(
        name: "CancellationRequests",
        columns: table => new
        {
          Id = table.Column<long>(type: "bigint", nullable: false)
            .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
          ClassId = table.Column<long>(type: "bigint", nullable: false),
          RequestedByUserId = table.Column<long>(type: "bigint", nullable: false),
          RequestedByRole = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
          Reason = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
          Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
          RefundAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: true),
          RefundNote = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
          IsRefunded = table.Column<bool>(type: "boolean", nullable: false),
          ResolvedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
          ResolvedByUserId = table.Column<long>(type: "bigint", nullable: true),
          CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
          UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
          IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
        },
        constraints: table =>
        {
          table.PrimaryKey("PK_CancellationRequests", x => x.Id);
          table.ForeignKey(
            name: "FK_CancellationRequests_Classes_ClassId",
            column: x => x.ClassId,
            principalTable: "Classes",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
          table.ForeignKey(
            name: "FK_CancellationRequests_Users_RequestedByUserId",
            column: x => x.RequestedByUserId,
            principalTable: "Users",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
          table.ForeignKey(
            name: "FK_CancellationRequests_Users_ResolvedByUserId",
            column: x => x.ResolvedByUserId,
            principalTable: "Users",
            principalColumn: "Id",
            onDelete: ReferentialAction.Restrict);
        });

      migrationBuilder.CreateIndex(
        name: "IX_CancellationRequests_ClassId_Status",
        table: "CancellationRequests",
        columns: new[] { "ClassId", "Status" });

      migrationBuilder.CreateIndex(
        name: "IX_CancellationRequests_RequestedByUserId",
        table: "CancellationRequests",
        column: "RequestedByUserId");

      migrationBuilder.CreateIndex(
        name: "IX_CancellationRequests_ResolvedByUserId",
        table: "CancellationRequests",
        column: "ResolvedByUserId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
      migrationBuilder.DropTable(
        name: "CancellationRequests");
    }
  }
}
