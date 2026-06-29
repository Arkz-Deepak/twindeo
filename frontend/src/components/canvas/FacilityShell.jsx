import React from "react";
import { useGLTF } from "@react-three/drei";

/**
 * The Static Shell: the single .glb representing unmoving factory
 * walls and floors.
 *
 * Resolved technical debt (see handoff doc §5): industrial CAD
 * software exports with Z facing "up", while WebGL/Three.js treats Y
 * as "up" — without correction, buildings render sideways. We apply a
 * permanent -90° rotation around X on load to normalize the grid.
 */
export default function FacilityShell({ modelPath }) {
  const { scene } = useGLTF(modelPath);

  return (
    <primitive object={scene} rotation={[-Math.PI / 2, 0, 0]} receiveShadow />
  );
}
