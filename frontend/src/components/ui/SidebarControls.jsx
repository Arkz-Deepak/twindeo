import React from "react";

function healthColor(score) {
  if (score == null) return "var(--text-secondary)";
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "#e0b03d";
  return "var(--danger)";
}

export default function SidebarControls({
  placedAssets,
  selectedAssetId,
  onSelectAsset,
  activeTool,
  onChangeTool,
}) {
  const assetEntries = Object.entries(placedAssets);

  return (
    <>
      <div className="panel-section">
        <h2 className="panel-title">Twindeo</h2>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: 0 }}>
          Industrial Digital Twin Viewer
        </p>
      </div>

      <div className="panel-section">
        <h3 className="panel-title">Tools</h3>
        <button
          className={`tool-button ${activeTool === "select" ? "tool-button--active" : ""}`}
          onClick={() => onChangeTool("select")}
        >
          ⠿ Select &amp; Move
        </button>
        <button
          className={`tool-button ${activeTool === "measure" ? "tool-button--active" : ""}`}
          onClick={() => onChangeTool("measure")}
        >
          📐 Measure Clearance
        </button>
        <button
          className={`tool-button ${activeTool === "walkthrough" ? "tool-button--active" : ""}`}
          onClick={() => onChangeTool("walkthrough")}
        >
          🚶 Walkthrough (First-Person)
        </button>
      </div>

      <div className="panel-section" style={{ flex: 1 }}>
        <h3 className="panel-title">Placed Assets ({assetEntries.length})</h3>
        {assetEntries.length === 0 && (
          <div className="empty-state">No assets loaded yet.</div>
        )}
        {assetEntries.map(([assetId, asset]) => (
          <button
            key={assetId}
            className={`asset-list-item ${
              selectedAssetId === assetId ? "asset-list-item--active" : ""
            }`}
            onClick={() => onSelectAsset(assetId)}
          >
            <span>
              <div>{assetId}</div>
              <div className="asset-list-item__type">{asset.type}</div>
            </span>
            {asset.metadata?.healthScore != null && (
              <span
                className="health-pill"
                style={{ color: healthColor(asset.metadata.healthScore) }}
              >
                <span
                  className="health-pill__dot"
                  style={{ background: healthColor(asset.metadata.healthScore) }}
                />
                {asset.metadata.healthScore}
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );
}
