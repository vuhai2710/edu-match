using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace EduMatch.Migrations
{
    /// <inheritdoc />
    public partial class AddAddressModule : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Area",
                table: "TutorRequests");

            migrationBuilder.AddColumn<long>(
                name: "AddressId",
                table: "TutorRequests",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "AddressId",
                table: "TutorProfiles",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "AddressId",
                table: "StudentProfiles",
                type: "bigint",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "Addresses",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    ProvinceId = table.Column<int>(type: "integer", nullable: false),
                    ProvinceName = table.Column<string>(type: "text", nullable: false),
                    DistrictId = table.Column<int>(type: "integer", nullable: false),
                    DistrictName = table.Column<string>(type: "text", nullable: false),
                    WardCode = table.Column<string>(type: "text", nullable: false),
                    WardName = table.Column<string>(type: "text", nullable: false),
                    AddressDetail = table.Column<string>(type: "text", nullable: true),
                    FullAddress = table.Column<string>(type: "text", nullable: false),
                    Latitude = table.Column<double>(type: "double precision", nullable: true),
                    Longitude = table.Column<double>(type: "double precision", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Addresses", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TutorRequests_AddressId",
                table: "TutorRequests",
                column: "AddressId");

            migrationBuilder.CreateIndex(
                name: "IX_TutorProfiles_AddressId",
                table: "TutorProfiles",
                column: "AddressId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentProfiles_AddressId",
                table: "StudentProfiles",
                column: "AddressId");

            migrationBuilder.AddForeignKey(
                name: "FK_StudentProfiles_Addresses_AddressId",
                table: "StudentProfiles",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TutorProfiles_Addresses_AddressId",
                table: "TutorProfiles",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_TutorRequests_Addresses_AddressId",
                table: "TutorRequests",
                column: "AddressId",
                principalTable: "Addresses",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StudentProfiles_Addresses_AddressId",
                table: "StudentProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_TutorProfiles_Addresses_AddressId",
                table: "TutorProfiles");

            migrationBuilder.DropForeignKey(
                name: "FK_TutorRequests_Addresses_AddressId",
                table: "TutorRequests");

            migrationBuilder.DropTable(
                name: "Addresses");

            migrationBuilder.DropIndex(
                name: "IX_TutorRequests_AddressId",
                table: "TutorRequests");

            migrationBuilder.DropIndex(
                name: "IX_TutorProfiles_AddressId",
                table: "TutorProfiles");

            migrationBuilder.DropIndex(
                name: "IX_StudentProfiles_AddressId",
                table: "StudentProfiles");

            migrationBuilder.DropColumn(
                name: "AddressId",
                table: "TutorRequests");

            migrationBuilder.DropColumn(
                name: "AddressId",
                table: "TutorProfiles");

            migrationBuilder.DropColumn(
                name: "AddressId",
                table: "StudentProfiles");

            migrationBuilder.AddColumn<string>(
                name: "Area",
                table: "TutorRequests",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);
        }
    }
}
