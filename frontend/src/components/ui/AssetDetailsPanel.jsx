import React, { useEffect, useState } from "react";
import { fetchAssetById } from "../../api/assetsApi.js";

function healthColor(score) {
  if (score == null) return "var(--text-secondary)";
  if (score >= 80) return "var(--success)";
  if (score >= 60) return "#e0b03d";
  return "var(--danger)";
}

export default function AssetDetailsPanel({ assetId, fallbackAsset }) {
  const [details, setDetails] = useState(fallbackAsset || null);
  const [status, setStatus] = useState(assetId ? "loading" : "idle");

  // Per the doc: .glb files carry no metadata. Clicking an asset in the
  // canvas only gives us its asset_id — this effect fetches the rest
  // (OEM, health score, maintenance date) from Postgres on demand.
  useEffect(() => {
    if (!assetId) {
      setDetails(null);
      setStatus("idle");
      return;
    }

    let cancelled = false;
    setStatus("loading");

    fetchAssetById(assetId)
      .then((data) => {
        if (cancelled) return;
        setDetails(data);
        setStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(`Failed to fetch details for ${assetId}`, err);
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [assetId]);

  if (!assetId) {
    return (
      <div className="panel-section">
        <h3 className="panel-title">Asset Details</h3>
        <div className="empty-state">Select an asset in the scene or sidebar to inspect it.</div>
      </div>
    );
  }

  return (
    <div className="panel-section">
      <h3 className="panel-title">Asset Details</h3>
      <div className="panel-row">
        <span className="panel-row__label">ID</span>
        <span className="panel-row__value">{assetId}</span>
      </div>

      {status === "loading" && !details && (
        <div className="empty-state">Fetching metadata…</div>
      )}
      {status === "error" && (
        <div className="empty-state">Couldn't load metadata for this asset.</div>
      )}

      {details && (
        <>
          <div className="panel-row">
            <span className="panel-row__label">Type</span>
            <span className="panel-row__value">{details.type}</span>
          </div>
          <div className="panel-row">
            <span className="panel-row__label">OEM</span>
            <span className="panel-row__value">{details.metadata?.oem ?? "—"}</span>
          </div>
          <div className="panel-row">
            <span className="panel-row__label">Health</span>
            <span
              className="panel-row__value"
              style={{ color: healthColor(details.metadata?.healthScore) }}
            >
              {details.metadata?.healthScore ?? "—"}
            </span>
          </div>
          <div className="panel-row">
            <span className="panel-row__label">Last Maintenance</span>
            <span className="panel-row__value">
              {details.metadata?.lastMaintenanceDate ?? "—"}
            </span>
          </div>
          <div className="panel-row">
            <span className="panel-row__label">Position</span>
            <span className="panel-row__value">
              {details.position?.map((v) => v.toFixed(2)).join(", ")}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
