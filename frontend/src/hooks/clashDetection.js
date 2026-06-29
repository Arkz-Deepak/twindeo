// Axis-Aligned Bounding Box collision detection, as specified in the
// handoff doc section 4B. Each asset has a position (center) and a
// bbox of half-extents [hx, hy, hz].
//
// Two AABBs overlap on an axis when:
//   (min1 <= max2) AND (max1 >= min2)
// They collide in 3D only if they overlap on ALL THREE axes.

function getBounds(position, bbox) {
  const [x, y, z] = position;
  const [hx, hy, hz] = bbox;
  return {
    minX: x - hx,
    maxX: x + hx,
    minY: y - hy,
    maxY: y + hy,
    minZ: z - hz,
    maxZ: z + hz,
  };
}

function overlapsOnAxis(min1, max1, min2, max2) {
  return min1 <= max2 && max1 >= min2;
}

/**
 * Returns true if two assets' AABBs overlap in 3D space.
 * @param {[number,number,number]} positionA
 * @param {[number,number,number]} bboxA half-extents
 * @param {[number,number,number]} positionB
 * @param {[number,number,number]} bboxB half-extents
 */
export function aabbIntersects(positionA, bboxA, positionB, bboxB) {
  const a = getBounds(positionA, bboxA);
  const b = getBounds(positionB, bboxB);

  return (
    overlapsOnAxis(a.minX, a.maxX, b.minX, b.maxX) &&
    overlapsOnAxis(a.minY, a.maxY, b.minY, b.maxY) &&
    overlapsOnAxis(a.minZ, a.maxZ, b.minZ, b.maxZ)
  );
}

/**
 * Checks a candidate (movingId, position, bbox) against every other
 * placed asset in the hash map. Returns true if ANY clash is found.
 * Skips comparing the asset against itself.
 *
 * @param {string} movingId
 * @param {[number,number,number]} candidatePosition
 * @param {[number,number,number]} candidateBbox
 * @param {Record<string, {position:number[], bbox:number[]}>} placedAssets
 */
export function detectClash(movingId, candidatePosition, candidateBbox, placedAssets) {
  for (const [assetId, asset] of Object.entries(placedAssets)) {
    if (assetId === movingId) continue;
    if (aabbIntersects(candidatePosition, candidateBbox, asset.position, asset.bbox)) {
      return true;
    }
  }
  return false;
}
