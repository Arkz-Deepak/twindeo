-- Twindeo: Asset metadata + spatial coordinates schema
-- Mirrors the "Database Decoupling" principle from the handoff doc:
-- .glb files carry NO text metadata. Everything below is fetched
-- by asset_id when the frontend clicks an object in the 3D scene.

CREATE TABLE IF NOT EXISTS assets (
  asset_id      VARCHAR(50) PRIMARY KEY,        -- e.g. "P-101" (matches the React hash map key)
  asset_type    VARCHAR(50) NOT NULL,           -- "pump" | "lathe" | "tank" | ...
  model_path    VARCHAR(255) NOT NULL,          -- e.g. "/models/pump.glb"
  oem           VARCHAR(100),
  health_score  SMALLINT CHECK (health_score BETWEEN 0 AND 100),
  last_maintenance_date DATE,
  pos_x         DOUBLE PRECISION NOT NULL DEFAULT 0,
  pos_y         DOUBLE PRECISION NOT NULL DEFAULT 0,
  pos_z         DOUBLE PRECISION NOT NULL DEFAULT 0,
  rot_x         DOUBLE PRECISION NOT NULL DEFAULT 0,
  rot_y         DOUBLE PRECISION NOT NULL DEFAULT 0,
  rot_z         DOUBLE PRECISION NOT NULL DEFAULT 0,
  bbox_x        DOUBLE PRECISION NOT NULL DEFAULT 1, -- AABB half-extents for clash detection
  bbox_y        DOUBLE PRECISION NOT NULL DEFAULT 1,
  bbox_z        DOUBLE PRECISION NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assets_type ON assets (asset_type);

-- Seed data: a few example assets placed around an arbitrary 20x20m shell.
-- Swap model_path values for your real .glb filenames once uploaded.
INSERT INTO assets (asset_id, asset_type, model_path, oem, health_score, last_maintenance_date, pos_x, pos_y, pos_z, bbox_x, bbox_y, bbox_z)
VALUES
  ('P-101', 'pump',  '/models/pump.glb',  'Grundfos',  92, '2026-03-12', -4, 0, -3, 0.6, 0.8, 0.6),
  ('P-102', 'pump',  '/models/pump.glb',  'Grundfos',  78, '2026-01-22',  2, 0, -3, 0.6, 0.8, 0.6),
  ('L-201', 'lathe', '/models/lathe.glb', 'Haas',      65, '2025-11-05',  4, 0,  2, 1.0, 1.2, 1.5),
  ('T-301', 'tank',  '/models/tank.glb',  'Crom',      88, '2026-02-18', -3, 0,  4, 1.2, 1.8, 1.2)
ON CONFLICT (asset_id) DO NOTHING;
