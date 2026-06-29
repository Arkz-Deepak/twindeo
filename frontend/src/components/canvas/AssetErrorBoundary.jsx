import React from "react";

/**
 * Isolates a single asset's load failure so one missing or corrupt
 * .glb (e.g. a 404 that Vite serves as index.html, which then fails
 * GLTF parsing) doesn't unmount the entire <Canvas> and every other
 * placed asset along with it.
 *
 * Must be a class component — React only supports error boundaries
 * via getDerivedStateFromError/componentDidCatch, there's no hook
 * equivalent.
 */
export default class AssetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error(`[AssetErrorBoundary] Failed to load asset "${this.props.assetId}":`, error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}
