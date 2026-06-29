const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

async function handleResponse(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// GET /api/assets — full asset list, used once on app load to seed
// the TwindeoEditor hash map.
export async function fetchAllAssets() {
  const res = await fetch(`${API_BASE_URL}/assets`);
  return handleResponse(res);
}

// GET /api/assets/:assetId — single asset metadata fetch, fired by
// AssetDetailsPanel's useEffect when a new asset is clicked in the canvas.
export async function fetchAssetById(assetId) {
  const res = await fetch(`${API_BASE_URL}/assets/${encodeURIComponent(assetId)}`);
  return handleResponse(res);
}

// PATCH /api/assets/:assetId/transform — persist position/rotation.
// Called only on a successful (non-clashing) drag release.
export async function updateAssetTransform(assetId, position, rotation) {
  const res = await fetch(`${API_BASE_URL}/assets/${encodeURIComponent(assetId)}/transform`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ position, rotation }),
  });
  return handleResponse(res);
}
