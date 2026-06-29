import React, { Suspense, lazy, useCallback, useEffect, useState } from "react";
import SidebarControls from "./ui/SidebarControls.jsx";
import AssetDetailsPanel from "./ui/AssetDetailsPanel.jsx";
import { fetchAllAssets, updateAssetTransform } from "../api/assetsApi.js";

// Heavy 3D scene (Three.js + all .glb loading) is loaded lazily so the
// HTML sidebars render instantly while WebGL spins up in the background.
const SceneManager = lazy(() => import("./canvas/SceneManager.jsx"));

export default function TwindeoEditor() {
  // --- The O(1) Asset Hash Map ---
  // Keyed by SQL asset_id for instant lookups/updates when an engineer
  // interacts with a single machine among thousands.
  const [placedAssets, setPlacedAssets] = useState({});
  const [loadStatus, setLoadStatus] = useState("loading"); // loading | ready | error
  const [loadError, setLoadError] = useState(null);

  const [selectedAssetId, setSelectedAssetId] = useState(null);
  const [activeTool, setActiveTool] = useState("select"); // 'select' | 'measure' | 'walkthrough'
  const [clashingAssetId, setClashingAssetId] = useState(null);
  const [walkthroughLocked, setWalkthroughLocked] = useState(false);

  // Initial load: fetch every asset from Postgres (via Express) and
  // fold the array into the hash map.
  useEffect(() => {
    let cancelled = false;

    fetchAllAssets()
      .then((assets) => {
        if (cancelled) return;
        const map = {};
        for (const asset of assets) {
          map[asset.asset_id] = asset;
        }
        setPlacedAssets(map);
        setLoadStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load assets", err);
        setLoadError(err.message);
        setLoadStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Called by SceneManager only on a successful (non-clashing) drag
  // release. Updates local state immediately (optimistic) then
  // persists to Postgres via PATCH.
  const handleAssetTransformCommit = useCallback((assetId, position, rotation) => {
    setPlacedAssets((prev) => {
      if (!prev[assetId]) return prev;
      return {
        ...prev,
        [assetId]: { ...prev[assetId], position, rotation },
      };
    });

    updateAssetTransform(assetId, position, rotation).catch((err) => {
      console.error(`Failed to persist transform for ${assetId}`, err);
      // Note: in a production build, this is where we'd roll back the
      // optimistic update and surface a toast to the user.
    });
  }, []);

  const handleSelectAsset = useCallback((assetId) => {
    setSelectedAssetId(assetId);
  }, []);

  return (
    <div className="twindeo-app">
      <div className="twindeo-sidebar">
        <SidebarControls
          placedAssets={placedAssets}
          selectedAssetId={selectedAssetId}
          onSelectAsset={handleSelectAsset}
          activeTool={activeTool}
          onChangeTool={setActiveTool}
        />
      </div>

      <div className="twindeo-canvas-area">
        {loadStatus === "loading" && (
          <div className="twindeo-canvas-fallback">Loading facility layout…</div>
        )}
        {loadStatus === "error" && (
          <div className="twindeo-canvas-fallback">
            Couldn't load assets: {loadError}. Is the backend running on the configured API URL?
          </div>
        )}
        {loadStatus === "ready" && (
          <Suspense
            fallback={<div className="twindeo-canvas-fallback">Initializing 3D engine…</div>}
          >
            <SceneManager
              placedAssets={placedAssets}
              selectedAssetId={selectedAssetId}
              onSelectAsset={handleSelectAsset}
              activeTool={activeTool}
              clashingAssetId={clashingAssetId}
              onClashChange={setClashingAssetId}
              onAssetTransformCommit={handleAssetTransformCommit}
              onWalkthroughLockChange={setWalkthroughLocked}
            />
          </Suspense>
        )}

        {activeTool === "walkthrough" && loadStatus === "ready" && (
          <div className="walkthrough-hint">
            {walkthroughLocked
              ? "WASD to move · Shift to sprint · Esc to exit"
              : "Click inside the scene to start walking"}
          </div>
        )}
      </div>

      <div className="twindeo-sidebar twindeo-sidebar--right">
        <AssetDetailsPanel
          assetId={selectedAssetId}
          fallbackAsset={selectedAssetId ? placedAssets[selectedAssetId] : null}
        />
      </div>
    </div>
  );
}
