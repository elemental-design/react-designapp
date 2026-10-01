import { ViewStyle } from '../../types';
import { isDefined } from '../../utils/isDefined';

// Builds the SVG-like `fillGeometry`/`strokeGeometry` path for a plain
// rectangle, matching the format Figma uses in its REST JSON
// (e.g. `M0 0L326 0L326 200L0 200L0 0Z`).
export const makeRectPath = (width: number, height: number): string =>
  `M0 0L${width} 0L${width} ${height}L0 ${height}L0 0Z`;

const PRIMARY_AXIS_ALIGN: { [key: string]: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN' } = {
  'flex-start': 'MIN',
  center: 'CENTER',
  'flex-end': 'MAX',
  'space-between': 'SPACE_BETWEEN',
  'space-around': 'SPACE_BETWEEN',
};

const COUNTER_AXIS_ALIGN: { [key: string]: 'MIN' | 'CENTER' | 'MAX' } = {
  'flex-start': 'MIN',
  center: 'CENTER',
  'flex-end': 'MAX',
  stretch: 'MIN',
  baseline: 'MIN',
};

export type AutoLayoutFields = {
  layoutMode: 'HORIZONTAL' | 'VERTICAL';
  paddingLeft: number;
  paddingRight: number;
  paddingTop: number;
  paddingBottom: number;
  itemSpacing: number;
  primaryAxisAlignItems: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlignItems: 'MIN' | 'CENTER' | 'MAX';
  layoutSizingHorizontal: 'FIXED' | 'HUG';
  layoutSizingVertical: 'FIXED' | 'HUG';
};

// Maps the subset of flexbox styling that react-sketchapp already resolves
// through Yoga (padding, gap, flex-direction, justify/align) onto Figma's
// auto-layout node properties.
export const getAutoLayoutFields = (style: ViewStyle): AutoLayoutFields => {
  const layoutMode: 'HORIZONTAL' | 'VERTICAL' =
    style.flexDirection === 'row' || style.flexDirection === 'row-reverse'
      ? 'HORIZONTAL'
      : 'VERTICAL';

  return {
    layoutMode,
    paddingLeft: style.paddingLeft || 0,
    paddingRight: style.paddingRight || 0,
    paddingTop: style.paddingTop || 0,
    paddingBottom: style.paddingBottom || 0,
    // `gap` isn't part of react-sketchapp's style surface for Sketch (and is
    // ignored by Yoga/the Sketch backend), but it's the natural way to
    // express Figma's `itemSpacing` for auto-layout frames.
    itemSpacing: (style as any).gap || 0,
    primaryAxisAlignItems: PRIMARY_AXIS_ALIGN[style.justifyContent as string] || 'MIN',
    counterAxisAlignItems: COUNTER_AXIS_ALIGN[style.alignItems as string] || 'MIN',
    layoutSizingHorizontal: isDefined(style.width) ? 'FIXED' : 'HUG',
    layoutSizingVertical: isDefined(style.height) ? 'FIXED' : 'HUG',
  };
};
