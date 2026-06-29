# Twindeo™ — Industrial Digital Twin Platform

Full implementation of the Core 3D Engine & Architecture Blueprint
handoff doc: a React Three Fiber viewer backed by an Express +
PostgreSQL API, using the Federated CAD Model strategy (a static
`.glb` shell + independently loaded dynamic asset `.glb` files).

## Project layout

```
twindeo/
├── docker-compose.yml      # Postgres
├── db/init.sql             # schema + seed data
├── backend/                # Express API
│   └── src/
│       ├── index.js
│       ├── db/pool.js
│       └── routes/assets.js
└── frontend/                # Vite + React + R3F
    └── src/
        ├── components/
        │   ├── TwindeoEditor.jsx      # the "Brain" — hash map state
        │   ├── ui/                    # HTML sidebars
        │   └── canvas/                # WebGL: SceneManager, FacilityShell,
        │                              #         DraggableMachine, MeasurementLaser
        ├── hooks/clashDetection.js    # AABB collision math
        └── api/assetsApi.js          # fetch wrappers for the Express API
```

## Running it

### 1. Database

```bash
docker compose up -d
```

This starts Postgres on `localhost:5432` and runs `db/init.sql`
automatically on first boot (creates the `assets` table + seeds 4
example assets). If you've run it before and changed `init.sql`,
wipe the volume first: `docker compose down -v`.

### 2. Backend

```bash
cd backend
cp .env.example .env     # adjust DATABASE_URL if needed
npm install
npm run dev               # http://localhost:4000
```

Check it's alive: `curl http://localhost:4000/api/health`

### 3. Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

### 4. Add your `.glb` files

See `frontend/public/models/README.md` — drop in `shell.glb`,
`pump.glb`, `lathe.glb`, `tank.glb` (or update the paths in
`db/init.sql` / `SceneManager.jsx` to match your real filenames).

## What's implemented from the handoff doc

- **§1 Federated CAD strategy** — static shell + independent dynamic
  asset `.glb`s, loaded separately (`FacilityShell.jsx` /
  `DraggableMachine.jsx`).
- **§2 Lazy loading** — `SceneManager` is `React.lazy()`-loaded behind
  `<Suspense>` so sidebars render before Three.js initializes.
- **§2 Lighting/camera** — `<Environment preset="city">` HDRI +
  `<OrbitControls>`, disabled during drags.
- **§3 O(1) hash map** — `placedAssets` state in `TwindeoEditor.jsx`,
  keyed by `asset_id`.
- **§3 Database decoupling** — `.glb`s carry no metadata; clicking an
  asset fires a fetch-by-`asset_id` in `AssetDetailsPanel.jsx`.
- **§4A Drag performance decoupling** — `DraggableMachine.jsx` only
  mutates the Three.js ref during drag; React state/DB write only
  fires on `mouseUp`.
- **§4B Clash detection** — `hooks/clashDetection.js` implements AABB
  overlap math; clashing assets turn `#FF4D4D` and rubber-band back to
  `lastSafePosition` on illegal release.
- **§4C Clearance analysis** — `MeasurementLaser.jsx`, two-click
  raycast distance measurement with a floating HTML label.
- **§5 Z-up/Y-up fix** — `FacilityShell.jsx` applies the
  `[-Math.PI/2, 0, 0]` rotation on load.

## Known gaps / next steps

- No auth on the Express API yet — add before exposing beyond
  localhost.
- Optimistic transform updates don't currently roll back on a failed
  PATCH (noted with a comment in `TwindeoEditor.jsx`).
- `MeasurementLaser`'s catcher plane assumes a roughly ground-level
  facility; for multi-floor layouts you'll want per-floor measurement
  planes or a real raycast against the shell mesh instead.
- No automated tests yet — `hooks/clashDetection.js` is a pure
  function and the easiest place to start.
