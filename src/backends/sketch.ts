import { renderToJSON } from '../renderToJSON';
import { PlatformBridge } from '../types';
import { RenderBackend } from './types';

// NOTE: `./platformBridges/macos` (which pulls in the native
// `node-sketch-bridge` module) is required lazily, matching the existing
// `entrypoint.ts` behavior. This keeps `react-sketchapp` importable in
// plain Node.js (tests, bundlers, other backends, ...) without requiring a
// native binding that's only buildable/loadable from within Sketch.app.
function getDefaultSketchBridge(): PlatformBridge {
  return require('../platformBridges/macos').default;
}

// The Sketch backend: no behavior change from the existing (pre-refactor)
// `renderToJSON` -- it still generates Sketch file-format JSON headlessly
// via the same `buildTree` + `flexToSketchJSON` pipeline.
export const sketchBackend: RenderBackend = {
  name: 'sketch',
  get defaultPlatformBridge() {
    return getDefaultSketchBridge();
  },
  renderToJSON: (element, _options, platformBridge = getDefaultSketchBridge()) =>
    renderToJSON(platformBridge)(element),
};
