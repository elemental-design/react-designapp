import * as React from 'react';
import { PlatformBridge } from './types';
import { getBackend } from './backends';

export type RenderToDesignJSONOptions = {
  backend?: string;
  platformBridge?: PlatformBridge;
  [key: string]: unknown;
};

// Explicit, simple backend selection, e.g.:
//
//   renderToDesignJSON(<App />, { backend: 'figma' })
//   renderToDesignJSON(<App />, { backend: 'sketch' })
//
// Looks up the backend in the shared registry (see `./backends`), so adding
// a new backend (e.g. Penpot) later doesn't require changes here.
export function renderToDesignJSON(
  element: React.ReactElement,
  options: RenderToDesignJSONOptions = {},
): unknown {
  const { backend = 'sketch', platformBridge, ...backendOptions } = options;
  return getBackend(backend).renderToJSON(element, backendOptions, platformBridge);
}
