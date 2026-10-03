import { registerBackend, getBackend, listBackends } from './registry';
import { sketchBackend } from './sketch';
import { figmaBackend } from './figma';

registerBackend(sketchBackend);
registerBackend(figmaBackend);

export { registerBackend, getBackend, listBackends };
export { RenderBackend } from './types';
export { sketchBackend, figmaBackend };
