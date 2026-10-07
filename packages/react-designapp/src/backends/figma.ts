import { renderToFigmaJSON } from '../renderToFigmaJSON';
import NodeBridge from '../platformBridges/node';
import { RenderToFigmaJSONOptions } from '../jsonUtils/figmaJson/buildFigmaDocument';
import { FigmaFile } from '../jsonUtils/figmaJson/types';
import { RenderBackend } from './types';

// The backend registry remains headless; the live dev bridge consumes its snapshots.
export const figmaBackend: RenderBackend<FigmaFile, RenderToFigmaJSONOptions> = {
  name: 'figma',
  defaultPlatformBridge: NodeBridge,
  renderToJSON: (element, options, platformBridge = NodeBridge) =>
    renderToFigmaJSON(platformBridge)(element, options),
};
