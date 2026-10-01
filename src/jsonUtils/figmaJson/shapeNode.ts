import { TreeNode } from '../../types';
import { makeRectPath, getAutoLayoutFields } from './geometry';
import { makeFills, makeStrokes, makeEffects } from './paint';
import { FigmaFrameNode, FigmaNode, FigmaRect, FigmaRectangleNode } from './types';

// Builds the FRAME (container, has auto-layout fields + children) or
// RECTANGLE (leaf, has geometry) node for `sketch_view` / `sketch_artboard`
// / `sketch_image` style TreeNodes.
export function buildShapeNode(
  node: TreeNode,
  id: string,
  name: string,
  box: FigmaRect,
  children: FigmaNode[],
  forceFrame: boolean,
): FigmaFrameNode | FigmaRectangleNode {
  const { layout, style } = node;
  const fills = makeFills(style);
  const { strokes, strokeWeight } = makeStrokes(style);
  const effects = makeEffects(style);
  // `borderRadius` is a shorthand that `expandStyle` already expands into
  // the 4 individual corner props (see ViewRenderer / ImageRenderer, which
  // do the same destructuring for the Sketch backend); Figma's
  // `cornerRadius` only supports a single uniform radius, so fall back to
  // the top-left corner when all four aren't equal.
  const {
    borderTopLeftRadius = 0,
    borderTopRightRadius = 0,
    borderBottomRightRadius = 0,
    borderBottomLeftRadius = 0,
  } = style;
  const cornerRadius = borderTopLeftRadius || borderTopRightRadius || borderBottomRightRadius || borderBottomLeftRadius || 0;

  const common = {
    id,
    name,
    scrollBehavior: 'SCROLLS' as const,
    blendMode: 'PASS_THROUGH' as const,
    absoluteBoundingBox: box,
    absoluteRenderBounds: box,
    constraints: { vertical: 'TOP' as const, horizontal: 'LEFT' as const },
    relativeTransform: [
      [1, 0, layout.left],
      [0, 1, layout.top],
    ] as [[number, number, number], [number, number, number]],
    size: { x: layout.width, y: layout.height },
    strokes,
    strokeWeight,
    strokeAlign: 'INSIDE' as const,
    strokeGeometry: [],
    exportSettings: [],
    effects,
  };

  const isContainer = forceFrame || children.length > 0;

  if (isContainer) {
    const autoLayout = getAutoLayoutFields(style);
    const resolvedFills = fills.length ? fills : forceFrame ? makeFills({ backgroundColor: 'white' }) : [];

    return {
      ...common,
      type: 'FRAME',
      fills: resolvedFills,
      fillGeometry: [],
      ...autoLayout,
      cornerRadius,
      clipsContent: style.overflow === 'hidden' || style.overflow === 'scroll',
      backgrounds: resolvedFills,
      children,
    };
  }

  return {
    ...common,
    type: 'RECTANGLE',
    fills,
    fillGeometry: [{ path: makeRectPath(layout.width, layout.height), windingRule: 'NONZERO' }],
    cornerRadius,
  };
}
