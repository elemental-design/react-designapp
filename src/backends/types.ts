import * as React from 'react';
import { PlatformBridge } from '../types';

// A `RenderBackend` converts the design-app-neutral intermediate tree
// (built once, by the shared core, from React components + style
// resolution) into a specific design tool's native output.
//
// Today this only exposes a headless "render to JSON" capability (both the
// Sketch and Figma backends already work this way: no native app / live
// renderer required). Backends *may* additionally expose a live `render`
// that mutates a native document (as the Sketch backend does today), but
// that's backend-specific and not part of the shared contract -- it's not
// required for a backend to be usable (e.g. Figma has no live/hot renderer,
// only a separate plugin that imports the generated JSON).
export type RenderBackend<Json = unknown, Options = unknown> = {
  name: string;
  defaultPlatformBridge: PlatformBridge;
  renderToJSON: (
    element: React.ReactElement,
    options?: Options,
    platformBridge?: PlatformBridge,
  ) => Json;
};
