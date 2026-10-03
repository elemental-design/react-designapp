import { PlatformBridge, TreeNode } from '../../types';
import { getImageDataFromURL } from '../../utils/getImageDataFromURL';
import { FigmaPaint } from './types';

// Sketch's `FileFormat.PatternFillType` numeric values, as set by
// `Image.tsx`'s `ResizeModes` map (`contain: 3, cover: 1, stretch: 2,
// center: 1, repeat: 0, none: 1`) -- this is what ends up on the
// `sketch_image` TreeNode's `props.resizeMode` by the time it reaches the
// backend, since `<Image>` already resolves the string `resizeMode` prop to
// this numeric value before rendering `<sketch_image>`.
const SCALE_MODES: { [key: number]: 'FILL' | 'FIT' | 'CROP' | 'TILE' } = {
  0: 'TILE', // repeat
  1: 'FILL', // cover / center / none (best-effort -- Figma has no exact
  // equivalent of "center" or "none"; keeping them closest to Figma's
  // default fill behavior)
  2: 'FILL', // stretch
  3: 'FIT', // contain
};

function extractURLFromSource(source?: string | { uri?: string } | null): string | undefined {
  if (typeof source === 'string') {
    return source;
  }
  return (source || {}).uri;
}

// Builds the fills array for a `sketch_image` TreeNode, mirroring the
// Sketch backend's `ImageRenderer` (same `getImageDataFromURL` bridge call,
// same source-extraction logic), but targeting Figma's `IMAGE` paint shape
// instead of a Sketch image fill + data reference.
export function makeImageFills(node: TreeNode, platformBridge: PlatformBridge): FigmaPaint[] {
  const url = extractURLFromSource(node.props && node.props.source);
  const { data } = getImageDataFromURL(platformBridge)(url);
  const resizeMode = node.props && node.props.resizeMode;

  return [
    {
      blendMode: 'NORMAL',
      type: 'IMAGE',
      scaleMode: SCALE_MODES[resizeMode] || 'FILL',
      imageData: data,
    },
  ];
}
