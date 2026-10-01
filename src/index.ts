export { Platform } from './Platform';
export { StyleSheet } from './stylesheet';
export { getSymbolComponentByName, getSymbolMasterByName, injectSymbols } from './symbol';
export { useWindowDimensions } from './context';

export * from './components';
export * from './entrypoint';

// Design-app-agnostic backend API: new, additive, and backward compatible.
// `render` / `renderToJSON` (exported above, from `./entrypoint`) keep their
// existing Sketch-only behavior and signatures.
export { renderToFigmaJSON } from './renderToFigmaJSON';
export { renderToDesignJSON } from './renderToDesignJSON';
export { registerBackend, getBackend, listBackends, RenderBackend } from './backends';
