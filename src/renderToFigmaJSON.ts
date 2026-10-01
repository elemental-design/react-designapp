import * as React from 'react';
import { PlatformBridge } from './types';
import { buildTree } from './buildTree';
import {
  buildFigmaDocument,
  RenderToFigmaJSONOptions,
} from './jsonUtils/figmaJson/buildFigmaDocument';
import { FigmaFile } from './jsonUtils/figmaJson/types';
import NodeBridge from './platformBridges/node';

// Renders a React element tree (headlessly, no Figma API / plugin runtime
// involved) into a Figma REST-API-shaped file-format JSON document. This
// mirrors `renderToJSON` for the Sketch backend: same `buildTree` core, a
// different (design-app-specific) serialization of the resulting tree.
export const renderToFigmaJSON = (platformBridge: PlatformBridge = NodeBridge) => (
  element: React.ReactElement,
  options?: RenderToFigmaJSONOptions,
): FigmaFile => {
  const tree = buildTree(platformBridge)(element);
  return buildFigmaDocument(tree, options);
};
