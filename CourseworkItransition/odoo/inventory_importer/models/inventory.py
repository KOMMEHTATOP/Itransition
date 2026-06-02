import json
import urllib.parse
import urllib.request

from odoo import models, fields, api, _
from odoo.exceptions import UserError


class ImportedInventory(models.Model):
    _name = "inventory.imported"
    _description = "Imported Inventory"
    _order = "imported_at desc"

    name = fields.Char(string="Title", required=True)
    api_token = fields.Char(string="API Token")
    base_url = fields.Char(string="API Base URL")
    item_count = fields.Integer(string="Item Count")
    imported_at = fields.Datetime(string="Imported At")
    field_ids = fields.One2many(
        "inventory.imported.field", "inventory_id", string="Fields"
    )
    export_item_ids = fields.One2many(
        "inventory.export.item", "inventory_id", string="Items to Export"
    )

    def action_export(self):
        self.ensure_one()

        if not self.api_token or not self.base_url:
            raise UserError(_("This inventory has no API token / base URL to export to."))

        items_to_export = self.export_item_ids.filtered(lambda i: not i.exported)
        if not items_to_export:
            raise UserError(_("There are no new items to export."))

        ordered_items = list(items_to_export)
        payload = {"items": []}
        for item in ordered_items:
            fields_map = {
                value.field_id.name: (value.value or "")
                for value in item.value_ids
                if value.field_id
            }
            payload["items"].append({
                "customId": item.custom_id or None,
                "fields": fields_map,
            })

        url = "%s/api/external/inventory/items?token=%s" % (
            self.base_url.rstrip("/"),
            urllib.parse.quote(self.api_token),
        )
        data = json.dumps(payload).encode("utf-8")

        try:
            request = urllib.request.Request(url, data=data, method="POST", headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "Mozilla/5.0 (compatible; OdooInventoryImporter/1.0)",
            })
            with urllib.request.urlopen(request, timeout=20) as response:
                result = json.loads(response.read().decode("utf-8"))
        except Exception as error:
            raise UserError(_("Export failed: %s") % error)

        # Write the generated Custom IDs back into Odoo and mark exported items.
        for item, item_result in zip(ordered_items, result.get("results", [])):
            if item_result.get("success"):
                item.write({
                    "exported": True,
                    "custom_id": item_result.get("customId") or item.custom_id,
                })

        created = result.get("created", 0)
        if created == 0:
            errors = [r.get("error") for r in result.get("results", []) if not r.get("success")]
            raise UserError(_("No items were created. %s") % ("; ".join(filter(None, errors))))

        # Reload the form so the updated Custom IDs / Exported flags are visible immediately.
        return {
            "type": "ir.actions.act_window",
            "res_model": "inventory.imported",
            "res_id": self.id,
            "view_mode": "form",
            "target": "current",
        }


class ImportedField(models.Model):
    _name = "inventory.imported.field"
    _description = "Imported Inventory Field"
    _order = "id"

    inventory_id = fields.Many2one(
        "inventory.imported",
        string="Inventory",
        ondelete="cascade",
        required=True,
    )
    name = fields.Char(string="Field", required=True)
    field_type = fields.Char(string="Type")
    aggregate = fields.Char(string="Aggregated Result")


class ExportItem(models.Model):
    _name = "inventory.export.item"
    _description = "Item to Export to Course Project"
    _order = "id"

    inventory_id = fields.Many2one(
        "inventory.imported",
        string="Inventory",
        ondelete="cascade",
        required=True,
    )
    custom_id = fields.Char(string="Custom ID")
    value_ids = fields.One2many(
        "inventory.export.item.value", "item_id", string="Field Values"
    )
    exported = fields.Boolean(string="Exported", default=False)
    summary = fields.Char(string="Values", compute="_compute_summary")

    @api.depends("value_ids.field_id", "value_ids.value")
    def _compute_summary(self):
        for item in self:
            item.summary = ", ".join(
                "%s: %s" % (value.field_id.name, value.value or "")
                for value in item.value_ids
                if value.field_id
            )


class ExportItemValue(models.Model):
    _name = "inventory.export.item.value"
    _description = "Export Item Field Value"
    _order = "id"

    item_id = fields.Many2one(
        "inventory.export.item",
        string="Item",
        ondelete="cascade",
        required=True,
    )
    field_id = fields.Many2one(
        "inventory.imported.field",
        string="Field",
        required=True,
        ondelete="cascade",
    )
    value = fields.Char(string="Value")
