using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InventoryApi.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryApiToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApiToken",
                table: "Inventories",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Inventories_ApiToken",
                table: "Inventories",
                column: "ApiToken",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Inventories_ApiToken",
                table: "Inventories");

            migrationBuilder.DropColumn(
                name: "ApiToken",
                table: "Inventories");
        }
    }
}
