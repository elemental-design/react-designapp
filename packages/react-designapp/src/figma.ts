import * as React from 'react';
import { renderToFigmaJSON as _renderToFigmaJSON } from './renderToFigmaJSON';
import { RenderToFigmaJSONOptions } from './jsonUtils/figmaJson/buildFigmaDocument';
import { FigmaFile } from './jsonUtils/figmaJson/types';
import { PlatformBridge } from './types';
import NodeBridge from './platformBridges/node';

// Headless and live snapshots share the same layout and serialization pipeline.
export function renderToJSON(
  element: React.ReactElement,
  options?: RenderToFigmaJSONOptions,
  platformBridge: PlatformBridge = NodeBridge,
): FigmaFile {
  return _renderToFigmaJSON(platformBridge)(element, options);
}

export { StyleSheet } from './stylesheet';
export * from './components';

export type LiveRenderOptions = RenderToFigmaJSONOptions & { projectId: string; rootId: string };

// Explicit native IDs are optional; anonymous nodes use positional reconciliation.
export function renderToLiveJSON(element: React.ReactElement, options: LiveRenderOptions) {
  if (!options.projectId || !options.rootId)
    throw new Error('Live rendering requires projectId and rootId');
  if (options.autoLayout)
    throw new Error('Live rendering currently uses Yoga positions; autoLayout is unsupported');
  const file = renderToJSON(element, options);
  if (file.document.children.length !== 1)
    throw new Error('Live rendering currently supports one page per render root');
  const seen = new Set<string>();
  type Node = import('./jsonUtils/figmaJson/types').FigmaNode;
  const collect = (node: Node) => {
    if (node.renderId) {
      if (seen.has(node.renderId)) throw new Error(`Duplicate native ID: ${node.renderId}`);
      seen.add(node.renderId);
    }
    if (node.type === 'FRAME') node.children.forEach(collect);
  };
  file.document.children[0].children.forEach(collect);
  const assign = (node: Node, parentId: string, index: number) => {
    if (!node.renderId) {
      const base = `@auto/${encodeURIComponent(parentId)}/${index}`;
      let candidate = base;
      let suffix = 1;
      while (seen.has(candidate)) candidate = `${base}~${suffix++}`;
      node.renderId = candidate;
      seen.add(candidate);
    }
    // Explicit IDs anchor anonymous descendants across movement of the parent.
    if (node.type === 'FRAME') {
      node.children.forEach((child, childIndex) => assign(child, node.renderId!, childIndex));
    }
  };
  file.document.children[0].children.forEach((node, index) => assign(node, '$root', index));
  return { schemaVersion: 1 as const, projectId: options.projectId, rootId: options.rootId, file };
}
