import React from "react";

/**
 * Stand-in for any asset whose .glb failed to load (404, corrupt
 * file, etc). Keeps the asset visible and clickable in the scene
 * instead of silently disappearing, so engineers still know it's
 * there and can see roughly where it sits — useful while a model
 * pipeline is still mid-migration and not every asset has its real
 * mesh yet.
 */
export default function MissingAssetPlaceholder({ position, bbox, onSelect }) {
  return (
    <mesh
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <boxGeometry args={[bbox[0] * 2, bbox[1] * 2, bbox[2] * 2]} />
      <meshStandardMaterial color="#5a6470" wireframe />
    </mesh>
  );
}
