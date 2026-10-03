import { renderToFigmaJSON } from '../renderToFigmaJSON';
import NodeBridge from '../platformBridges/node';
import { RenderToFigmaJSONOptions } from '../jsonUtils/figmaJson/buildFigmaDocument';
import { FigmaFile } from '../jsonUtils/figmaJson/types';
import { RenderBackend } from './types';

// The Figma backend: headless, like the Sketch backend -- it takes the
// shared intermediate tree and outputs Figma file-format JSON. There is no
// Figma API usage and no live/hot renderer; a separate Figma plugin is
// responsible for importing this JSON and creating the actual pages,
// frames, text nodes, styles, etc. in a Figma document.
export const figmaBackend: RenderBackend<FigmaFile, RenderToFigmaJSONOptions> = {
  name: 'figma',
  defaultPlatformBridge: NodeBridge,
  renderToJSON: (element, options, platformBridge = NodeBridge) =>
    renderToFigmaJSON(platformBridge)(element, options),
};
