import { PlatformBridge, TreeNode } from '../../types';
import { makeRectPath, getAutoLayoutFields } from './geometry';
import { makeFills, makeStrokes, makeEffects } from './paint';
import { makeImageFills } from './imagePaint';
import { resolveRadii } from '../../utils/resolveRadius';
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
  platformBridge: PlatformBridge,
  autoLayout = false,
): FigmaFrameNode | FigmaRectangleNode {
  const { layout, style } = node;
  const fills =
    node.type === 'sketch_image' ? makeImageFills(node, platformBridge) : makeFills(style);
  const { strokes, strokeWeight } = makeStrokes(style);
  const effects = makeEffects(style);
  // `borderRadius` is a shorthand that `expandStyle` already expands into
  // the 4 individual corner props (see ViewRenderer / ImageRenderer, which
  // do the same destructuring for the Sketch backend); Figma's
  // `cornerRadius` only supports a single uniform radius (per-corner radii
  // would need `rectangleCornerRadii`, which isn't implemented here), so we
  // fall back to the largest corner value when they aren't all equal.
  const cornerRadius = Math.max(...resolveRadii(style, layout.width, layout.height));

  const common = {
    id,
    name,
    scrollBehavior: 'SCROLLS' as const,
    blendMode: 'PASS_THROUGH' as const,
    absoluteBoundingBox: box,
    absoluteRenderBounds: box,
    constraints: { vertical: 'MIN' as const, horizontal: 'MIN' as const },
    relativeTransform: [
      [1, 0, layout.left],
      [0, 1, layout.top],
    ] as [[number, number, number], [number, number, number]],
    x: layout.left,
    y: layout.top,
    width: layout.width,
    height: layout.height,
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
    const autoLayoutFields = autoLayout
      ? getAutoLayoutFields(style)
      : { ...getAutoLayoutFields(style), layoutMode: 'NONE' as const };
    // Artboards (forceFrame) default to a white background, matching the
    // Sketch backend's artboard default, when no explicit fill is set.
    let resolvedFills = fills;
    if (!resolvedFills.length && forceFrame) {
      resolvedFills = makeFills({ backgroundColor: 'white' });
    }

    return {
      ...common,
      type: 'FRAME',
      fills: resolvedFills,
      fillGeometry: [],
      ...autoLayoutFields,
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
