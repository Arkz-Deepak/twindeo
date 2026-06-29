import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import FacilityShell from "./FacilityShell.jsx";
import DraggableMachine from "./DraggableMachine.jsx";
import MeasurementLaser from "./MeasurementLaser.jsx";
import AssetErrorBoundary from "./AssetErrorBoundary.jsx";
import MissingAssetPlaceholder from "./MissingAssetPlaceholder.jsx";
import WalkthroughControls from "./WalkthroughControls.jsx";

export default function SceneManager({
  placedAssets,
  selectedAssetId,
  onSelectAsset,
  activeTool,
  clashingAssetId,
  onClashChange,
  onAssetTransformCommit,
  onWalkthroughLockChange,
}) {
  // Camera rotation (OrbitControls) is disabled while the user is
  // actively dragging a machine, so TransformControls doesn't fight
  // the orbit camera for mouse input. DraggableMachine reports this
  // up via onDragStateChange.
  const [orbitEnabled, setOrbitEnabled] = React.useState(true);

  return (
    <Canvas camera={{ position: [10, 10, 10], fov: 50 }} shadows>
      <Suspense fallback={null}>
        {/* 360-degree HDRI studio lighting so metallic industrial
            assets render realistically instead of looking flat. */}
        <Environment preset="city" />
        <ambientLight intensity={0.3} />
        <directionalLight position={[8, 12, 6]} intensity={1.1} castShadow />

        <FacilityShell modelPath="/models/shell.glb" />

        {Object.entries(placedAssets).map(([assetId, asset]) => (
          <AssetErrorBoundary
            key={assetId}
            assetId={assetId}
            fallback={
              <MissingAssetPlaceholder
                position={asset.position}
                bbox={asset.bbox}
                onSelect={() => onSelectAsset(assetId)}
              />
            }
          >
            <DraggableMachine
              assetId={assetId}
              asset={asset}
              isSelected={selectedAssetId === assetId}
              isClashing={clashingAssetId === assetId}
              interactive={activeTool === "select"}
              placedAssets={placedAssets}
              onSelect={() => onSelectAsset(assetId)}
              onClashChange={onClashChange}
              onDragStateChange={(dragging) => setOrbitEnabled(!dragging)}
              onTransformCommit={onAssetTransformCommit}
            />
          </AssetErrorBoundary>
        ))}

        {activeTool === "measure" && <MeasurementLaser />}
      </Suspense>

      {activeTool === "walkthrough" ? (
        <WalkthroughControls onLockChange={onWalkthroughLockChange} />
      ) : (
        <OrbitControls makeDefault enabled={orbitEnabled} />
      )}
    </Canvas>
  );
}
