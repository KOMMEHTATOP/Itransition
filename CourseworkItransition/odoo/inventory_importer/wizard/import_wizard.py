import json
import urllib.parse
import urllib.request

from odoo import models, fields, _
from odoo.exceptions import UserError


class InventoryImportWizard(models.TransientModel):
    _name = "inventory.import.wizard"
    _description = "Import Inventory by API Token"

    base_url = fields.Char(
        string="API Base URL",
        required=True,
        default="https://api.basharov.org",
    )
    api_token = fields.Char(string="API Token", required=True)

    def action_import(self):
        self.ensure_one()

        token = (self.api_token or "").strip()
        if not token:
            raise UserError(_("Please provide an API token."))

        url = "%s/api/external/inventory?token=%s" % (
            self.base_url.rstrip("/"),
            urllib.parse.quote(token),
        )

        try:
            request = urllib.request.Request(url, headers={
                "Accept": "application/json",
                # A non-default User-Agent is required: Cloudflare (in front of the prod API)
                # blocks the default "Python-urllib/..." agent with HTTP 403.
                "User-Agent": "Mozilla/5.0 (compatible; OdooInventoryImporter/1.0)",
            })
            with urllib.request.urlopen(request, timeout=20) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except Exception as error:
            raise UserError(_("Failed to fetch data from the API: %s") % error)

        field_commands = [
            (0, 0, {
                "name": field.get("title"),
                "field_type": field.get("type"),
                "aggregate": self._format_aggregate(field),
            })
            for field in payload.get("fields", [])
        ]

        values = {
            "name": payload.get("title") or _("Untitled"),
            "api_token": token,
            "base_url": self.base_url.rstrip("/"),
            "item_count": payload.get("itemCount", 0),
            "imported_at": fields.Datetime.now(),
            "field_ids": field_commands,
        }

        # Upsert by token: refresh an existing import instead of creating duplicates.
        existing = self.env["inventory.imported"].search(
            [("api_token", "=", token)], limit=1
        )
        if existing:
            existing.field_ids.unlink()
            existing.write(values)
            inventory = existing
        else:
            inventory = self.env["inventory.imported"].create(values)

        return {
            "type": "ir.actions.act_window",
            "res_model": "inventory.imported",
            "res_id": inventory.id,
            "view_mode": "form",
            "target": "current",
        }

    @staticmethod
    def _format_aggregate(field):
        numeric = field.get("numeric")
        if numeric:
            return "avg %s, min %s, max %s" % (
                numeric.get("average"),
                numeric.get("min"),
                numeric.get("max"),
            )

        boolean = field.get("boolean")
        if boolean:
            return "true: %s, false: %s" % (
                boolean.get("trueCount"),
                boolean.get("falseCount"),
            )

        popular = field.get("popularValues")
        if popular:
            return ", ".join(
                "%s (%s)" % (value.get("value"), value.get("count"))
                for value in popular
            )

        return ""
