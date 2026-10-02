import { TreeNode } from '../../types';
import { makeSvgString } from '../makeSvgString';
import { FigmaRect, FigmaVectorNode } from './types';

// Builds a Figma VECTOR node for a `sketch_svg` TreeNode by serializing its
// (raw, un-flattened -- see `buildTree`'s `sketch_svg` special case) SVG
// children back into a flat SVG string, exactly like the Sketch backend
// does for its native SVG importer (see `SvgRenderer`/`makeSvgLayer`). The
// companion Figma plugin is expected to turn `svg` into real vector
// geometry (e.g. via `figma.createNodeFromSvg`) and position it using this
// node's standard bounding-box/transform fields.
export function buildSvgNode(
  node: TreeNode,
  id: string,
  name: string,
  box: FigmaRect,
): FigmaVectorNode {
  const { layout, props, children, style } = node;

  // add the "xmlns:xlink" namespace so we can use `href`, matching the
  // Sketch backend's `SvgRenderer`.
  const svgProps = { ...props, 'xmlns:xlink': 'http://www.w3.org/1999/xlink' };

  const svg = makeSvgString({
    type: 'svg_svg',
    props: svgProps,
    children,
    style,
    layout,
  });

  return {
    id,
    name,
    type: 'VECTOR',
    scrollBehavior: 'SCROLLS',
    blendMode: 'PASS_THROUGH',
    absoluteBoundingBox: box,
    absoluteRenderBounds: box,
    constraints: { vertical: 'MIN', horizontal: 'MIN' },
    relativeTransform: [
      [1, 0, layout.left],
      [0, 1, layout.top],
    ],
    x: layout.left,
    y: layout.top,
    width: layout.width,
    height: layout.height,
    size: { x: layout.width, y: layout.height },
    fills: [],
    fillGeometry: [],
    strokes: [],
    strokeWeight: 1,
    strokeAlign: 'INSIDE',
    strokeGeometry: [],
    exportSettings: [],
    effects: [],
    svg,
  };
}
