import React, { useEffect, useRef, useState } from "react";
import { PointerLockControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const WALK_SPEED = 4; // meters/second
const SPRINT_MULTIPLIER = 2;
const EYE_HEIGHT = 1.7; // meters — keeps the camera walking on a level plane,
                          // not flying, matching how an engineer actually
                          // moves through a facility.

/**
 * First-person walkthrough mode (POV movement inside the model).
 *
 * - Click into the canvas to lock the pointer; mouse look is handled
 *   entirely by drei's <PointerLockControls> (rotation only).
 * - WASD/arrow keys drive translation, computed here each frame from
 *   the camera's current look direction, flattened to the horizontal
 *   plane so looking up/down doesn't make you climb or dive.
 * - Esc (browser-native pointer-lock behavior) releases the lock.
 */
export default function WalkthroughControls({ onLockChange }) {
  const { camera } = useThree();
  const keys = useRef({ forward: false, back: false, left: false, right: false, sprint: false });
  const [locked, setLocked] = useState(false);

  // Reusable scratch vectors so we don't allocate new THREE.Vector3
  // instances every frame.
  const forward = useRef(new THREE.Vector3());
  const right = useRef(new THREE.Vector3());
  const move = useRef(new THREE.Vector3());

  useEffect(() => {
    // Start walking at a sensible standing height instead of
    // wherever the orbit camera happened to be (which could be
    // above the roof or underground depending on the prior view).
    camera.position.y = EYE_HEIGHT;
  }, [camera]);

  useEffect(() => {
    const onKeyDown = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = true;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.back = true;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = true;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.sprint = true;
          break;
        default:
          break;
      }
    };

    const onKeyUp = (e) => {
      switch (e.code) {
        case "KeyW":
        case "ArrowUp":
          keys.current.forward = false;
          break;
        case "KeyS":
        case "ArrowDown":
          keys.current.back = false;
          break;
        case "KeyA":
        case "ArrowLeft":
          keys.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keys.current.right = false;
          break;
        case "ShiftLeft":
        case "ShiftRight":
          keys.current.sprint = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  useFrame((_, delta) => {
    if (!locked) return;

    // Flatten the look direction to the XZ plane so pitch (looking
    // up/down) never changes walking height.
    camera.getWorldDirection(forward.current);
    forward.current.y = 0;
    forward.current.normalize();

    // Right-hand vector relative to the flattened forward direction.
    right.current.crossVectors(forward.current, camera.up).normalize();

    const speed = (keys.current.sprint ? WALK_SPEED * SPRINT_MULTIPLIER : WALK_SPEED) * delta;

    move.current.set(0, 0, 0);
    if (keys.current.forward) move.current.add(forward.current);
    if (keys.current.back) move.current.sub(forward.current);
    if (keys.current.right) move.current.add(right.current);
    if (keys.current.left) move.current.sub(right.current);

    if (move.current.lengthSq() > 0) {
      move.current.normalize().multiplyScalar(speed);
      camera.position.add(move.current);
    }

    // No flying/falling — clamp to a fixed walking height. (Known
    // limitation: this assumes a single-level facility. Multi-floor
    // layouts would need real ground collision/raycasting here.)
    camera.position.y = EYE_HEIGHT;
  });

  const handleLock = () => {
    setLocked(true);
    onLockChange?.(true);
  };

  const handleUnlock = () => {
    setLocked(false);
    onLockChange?.(false);
  };

  return <PointerLockControls onLock={handleLock} onUnlock={handleUnlock} />;
}
