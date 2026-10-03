import * as React from 'react';
import { renderToFigmaJSON as _renderToFigmaJSON } from './renderToFigmaJSON';
import { RenderToFigmaJSONOptions } from './jsonUtils/figmaJson/buildFigmaDocument';
import { FigmaFile } from './jsonUtils/figmaJson/types';
import { PlatformBridge } from './types';
import NodeBridge from './platformBridges/node';

// Figma backend entrypoint, analogous to `entrypoint.sketch.ts`. There is no
// live/hot renderer for Figma (no Figma API/network usage): this only
// produces headless Figma file-format JSON, which a separate Figma plugin
// imports to create pages, frames, text nodes, styles, etc.
//
// Usage (after building, e.g. from `lib/figma`):
//   import { renderToJSON } from 'react-designapp/figma';
//   const figmaFile = renderToJSON(<App />);
export function renderToJSON(
  element: React.ReactElement,
  options?: RenderToFigmaJSONOptions,
  platformBridge: PlatformBridge = NodeBridge,
): FigmaFile {
  return _renderToFigmaJSON(platformBridge)(element, options);
}

export { StyleSheet } from './stylesheet';
export * from './components';
