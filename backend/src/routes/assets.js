import { Router } from "express";
import { query } from "../db/pool.js";

export const assetsRouter = Router();

// Map a DB row into the flat shape the frontend hash map expects.
// Keeps the SQL schema (pos_x/pos_y/pos_z) decoupled from the
// React/Three.js shape (position: [x,y,z]) the doc specifies.
function toClientShape(row) {
  return {
    asset_id: row.asset_id,
    type: row.asset_type,
    modelPath: row.model_path,
    position: [Number(row.pos_x), Number(row.pos_y), Number(row.pos_z)],
    rotation: [Number(row.rot_x), Number(row.rot_y), Number(row.rot_z)],
    bbox: [Number(row.bbox_x), Number(row.bbox_y), Number(row.bbox_z)],
    metadata: {
      oem: row.oem,
      healthScore: row.health_score,
      lastMaintenanceDate: row.last_maintenance_date,
    },
  };
}

// GET /api/assets
// Returns every placed asset. The frontend folds this array into
// the O(1) hash map keyed by asset_id on load.
assetsRouter.get("/", async (_req, res) => {
  try {
    const result = await query(
      "SELECT * FROM assets ORDER BY created_at ASC"
    );
    res.json(result.rows.map(toClientShape));
  } catch (err) {
    console.error("[GET /api/assets]", err);
    res.status(500).json({ error: "Failed to load assets" });
  }
});

// GET /api/assets/:assetId
// Used by AssetDetailsPanel's useEffect fetch-on-click.
assetsRouter.get("/:assetId", async (req, res) => {
  try {
    const result = await query("SELECT * FROM assets WHERE asset_id = $1", [
      req.params.assetId,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Asset not found" });
    }
    res.json(toClientShape(result.rows[0]));
  } catch (err) {
    console.error("[GET /api/assets/:assetId]", err);
    res.status(500).json({ error: "Failed to load asset" });
  }
});

// PATCH /api/assets/:assetId/transform
// Called only on mouseUp after a *successful* (non-clashing) drag —
// matches the doc's "Performance Decoupling" rule: React/DB state
// is only written once the drag finalizes, never per-frame.
assetsRouter.patch("/:assetId/transform", async (req, res) => {
  const { position, rotation } = req.body;

  if (
    !Array.isArray(position) ||
    position.length !== 3 ||
    !Array.isArray(rotation) ||
    rotation.length !== 3
  ) {
    return res.status(400).json({
      error: "Body must include position:[x,y,z] and rotation:[x,y,z]",
    });
  }

  try {
    const result = await query(
      `UPDATE assets
       SET pos_x = $1, pos_y = $2, pos_z = $3,
           rot_x = $4, rot_y = $5, rot_z = $6,
           updated_at = now()
       WHERE asset_id = $7
       RETURNING *`,
      [...position, ...rotation, req.params.assetId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Asset not found" });
    }

    res.json(toClientShape(result.rows[0]));
  } catch (err) {
    console.error("[PATCH /api/assets/:assetId/transform]", err);
    res.status(500).json({ error: "Failed to update asset transform" });
  }
});
