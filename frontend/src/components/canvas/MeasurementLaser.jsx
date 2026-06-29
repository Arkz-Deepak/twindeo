import React, { useState } from "react";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";

/**
 * Clearance Analysis tool (doc §4C). Users click two points on the 3D
 * model; we capture e.point from Three.js raycasting at each click,
 * draw a line between them, and render a floating HTML label with
 * the distanceTo() result in meters.
 *
 * Click handling is attached to an invisible plane spanning the
 * scene so clicks register even on the floor / empty shell surfaces,
 * not just on asset meshes.
 */
export default function MeasurementLaser() {
  const [points, setPoints] = useState([]); // array of THREE.Vector3, max 2

  const handlePointerDown = (e) => {
    e.stopPropagation();
    const clicked = e.point.clone();

    setPoints((prev) => {
      if (prev.length >= 2) {
        // Start a new measurement on the third click.
        return [clicked];
      }
      return [...prev, clicked];
    });
  };

  const distance = points.length === 2 ? points[0].distanceTo(points[1]) : null;

  const midpoint =
    points.length === 2
      ? new THREE.Vector3().addVectors(points[0], points[1]).multiplyScalar(0.5)
      : null;

  return (
    <>
      {/* Invisible catcher plane so raycasts hit something everywhere,
          large enough to cover a typical facility footprint. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} onPointerDown={handlePointerDown} visible={false}>
        <planeGeometry args={[500, 500]} />
        <meshBasicMaterial />
      </mesh>

      {points.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="#4d9eff" />
        </mesh>
      ))}

      {points.length === 2 && (
        <>
          <Line points={[points[0], points[1]]} color="#4d9eff" lineWidth={2} />
          <Html position={midpoint} center>
            <div className="measurement-label">{distance.toFixed(2)} m</div>
          </Html>
        </>
      )}
    </>
  );
}
