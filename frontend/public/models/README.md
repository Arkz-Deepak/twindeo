# Twindeo — Model Assets

Drop your real `.glb` files here using these exact filenames (referenced
throughout the codebase), or update the paths in:

- `db/init.sql` (the `model_path` column for each seeded asset)
- `frontend/src/components/canvas/SceneManager.jsx` (the `FacilityShell` path)

Expected placeholder filenames:

- `shell.glb` — the static facility shell (walls, floors). Loaded once,
  never moves.
- `pump.glb` — dynamic asset model for pump-type equipment.
- `lathe.glb` — dynamic asset model for lathe-type equipment.
- `tank.glb` — dynamic asset model for tank-type equipment.

All models should be:

- Exported as `.glb` (binary glTF), Draco-compressed if possible to
  keep file sizes small (per the handoff doc's "optimized .glb"
  strategy).
- Centered at their own local origin — `DraggableMachine` positions
  them using the database `pos_x/pos_y/pos_z` columns, so off-center
  pivots will look like the part is "floating" relative to where
  TransformControls grabs it.
- Decimated to a reasonable vertex count for standard laptops (see
  doc §5, "WebGL Context Lost" troubleshooting note).

Until real files are added, `useGLTF` will throw a fetch error in the
browser console for any missing path — this is expected and the rest
of the app (sidebars, asset list, metadata panel) will still function
once you swap in real assets.
