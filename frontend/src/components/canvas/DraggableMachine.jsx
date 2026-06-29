import React, { useCallback, useRef } from "react";
import { useGLTF, TransformControls } from "@react-three/drei";
import * as THREE from "three";
import { detectClash } from "../../hooks/clashDetection.js";

const CLASH_COLOR = new THREE.Color("#FF4D4D");

/**
 * One independent dynamic asset (pump, lathe, tank...) loaded into the
 * scene at its database coordinates.
 *
 * Performance decoupling (doc §4A): while dragging, ONLY the Three.js
 * ref/material is mutated per-frame via TransformControls' "change"
 * event. React state (and the DB) is untouched until "mouseUp", when
 * the move is finalized — this is what keeps thousands of assets from
 * triggering re-render storms during a drag.
 *
 * Clash detection (doc §4B): on every "change" event we run an AABB
 * overlap check against all other placed assets. If the candidate
 * position clashes, the mesh material turns red. On mouseUp, a
 * clashing placement is rejected — the DB is never written, and the
 * mesh snaps back to lastSafePosition (a ref, not state, so the
 * snapback itself doesn't trigger a re-render either).
 */
export default function DraggableMachine({
  assetId,
  asset,
  isSelected,
  isClashing,
  interactive,
  placedAssets,
  onSelect,
  onClashChange,
  onDragStateChange,
  onTransformCommit,
}) {
  const { scene } = useGLTF(asset.modelPath);
  const meshRef = useRef();
  const lastSafePosition = useRef(asset.position);
  const lastSafeRotation = useRef(asset.rotation);
  const originalMaterialColors = useRef(new Map());

  const captureOriginalColors = useCallback(() => {
    if (!meshRef.current || originalMaterialColors.current.size > 0) return;
    meshRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        originalMaterialColors.current.set(child.uuid, child.material.color.clone());
      }
    });
  }, []);

  const setClashVisual = useCallback((isClash) => {
    if (!meshRef.current) return;
    meshRef.current.traverse((child) => {
      if (!child.isMesh || !child.material) return;
      if (isClash) {
        child.material.color.set(CLASH_COLOR);
      } else {
        const original = originalMaterialColors.current.get(child.uuid);
        if (original) child.material.color.copy(original);
      }
    });
  }, []);

  const handleChange = useCallback(() => {
    if (!meshRef.current) return;

    const position = meshRef.current.position.toArray();
    const isClash = detectClash(assetId, position, asset.bbox, placedAssets);

    setClashVisual(isClash);
    onClashChange(isClash ? assetId : null);
  }, [assetId, asset.bbox, placedAssets, onClashChange, setClashVisual]);

  const handleMouseDown = useCallback(() => {
    captureOriginalColors();
    onDragStateChange(true);
  }, [captureOriginalColors, onDragStateChange]);

  const handleMouseUp = useCallback(() => {
    onDragStateChange(false);

    if (!meshRef.current) return;

    const position = meshRef.current.position.toArray();
    const rotation = [
      meshRef.current.rotation.x,
      meshRef.current.rotation.y,
      meshRef.current.rotation.z,
    ];
    const isClash = detectClash(assetId, position, asset.bbox, placedAssets);

    if (isClash) {
      // Rubber-band snapback: reject the placement, do NOT touch the
      // database, restore the last known safe transform.
      meshRef.current.position.fromArray(lastSafePosition.current);
      meshRef.current.rotation.fromArray(lastSafeRotation.current);
      setClashVisual(false);
      onClashChange(null);
      return;
    }

    // Legal placement: update the refs and commit to React state + DB.
    lastSafePosition.current = position;
    lastSafeRotation.current = rotation;
    setClashVisual(false);
    onClashChange(null);
    onTransformCommit(assetId, position, rotation);
  }, [
    assetId,
    asset.bbox,
    placedAssets,
    onDragStateChange,
    onClashChange,
    onTransformCommit,
    setClashVisual,
  ]);

  const machineMesh = (
    <primitive
      ref={meshRef}
      object={scene.clone()}
      position={asset.position}
      rotation={asset.rotation}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    />
  );

  if (!interactive || !isSelected) {
    return machineMesh;
  }

  return (
    <TransformControls
      mode="translate"
      onObjectChange={handleChange}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      {machineMesh}
    </TransformControls>
  );
}
