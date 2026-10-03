import { PlatformBridge } from '../../types';
import { createStringMeasurer } from './createStringMeasurer';
import { findFontName } from './findFontName';
import { makeImageDataFromUrl } from './makeImageDataFromUrl';

// A pure Node.js implementation of the `PlatformBridge` interface, with no
// native dependency on `node-sketch-bridge` / macOS (NSFont, NSImage, ...).
//
// This is used as the default bridge for design-app-agnostic backends that
// can't rely on Sketch.app being installed (e.g. the Figma backend), and can
// also be used to run the Sketch backend headlessly (e.g. in CI, tests, or
// server-side JSON generation) when native font measurement isn't needed or
// available.
const NodeBridge: PlatformBridge = {
  createStringMeasurer,
  findFontName,
  makeImageDataFromUrl,
};

export default NodeBridge;
export { createStringMeasurer, findFontName, makeImageDataFromUrl };
