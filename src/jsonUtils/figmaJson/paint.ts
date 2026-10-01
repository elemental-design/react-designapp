import { ViewStyle, TextStyle } from '../../types';
import { hasAnyDefined } from '../../utils/hasAnyDefined';
import { toFigmaColor } from './colors';
import { FigmaEffect, FigmaPaint } from './types';

export const makeFills = (style: ViewStyle | TextStyle): FigmaPaint[] => {
  if (!style.backgroundColor) {
    return [];
  }

  return [
    {
      blendMode: 'NORMAL',
      type: 'SOLID',
      color: toFigmaColor(style.backgroundColor, resolveOpacity(style)),
    },
  ];
};

function resolveOpacity(style: ViewStyle | TextStyle): number {
  return style.opacity !== undefined && style.opacity !== null ? style.opacity : 1;
}

export const makeStrokes = (
  style: ViewStyle,
): { strokes: FigmaPaint[]; strokeWeight: number } => {
  // Prefer the uniform shorthand (`borderColor`/`borderWidth`). Otherwise,
  // pick the first edge that has *both* a color and a width defined, so we
  // never pair up a color and width from two different, possibly
  // mismatched edges (e.g. `borderTopColor` with `borderLeftWidth`).
  const edges: Array<[unknown, unknown]> = [
    [style.borderColor, style.borderWidth],
    [style.borderTopColor, style.borderTopWidth],
    [style.borderRightColor, style.borderRightWidth],
    [style.borderBottomColor, style.borderBottomWidth],
    [style.borderLeftColor, style.borderLeftWidth],
  ];

  const match = edges.find(([color, width]) => color && width) as
    | [string, number]
    | undefined;

  if (!match) {
    return { strokes: [], strokeWeight: 1 };
  }

  const [color, width] = match;

  return {
    strokes: [{ blendMode: 'NORMAL', type: 'SOLID', color: toFigmaColor(color) }],
    strokeWeight: width as number,
  };
};

const SHADOW_STYLES = [
  'shadowColor',
  'shadowOffset',
  'shadowOpacity',
  'shadowRadius',
  'shadowSpread',
  'textShadowColor',
  'textShadowOffset',
  'textShadowOpacity',
  'textShadowRadius',
  'textShadowSpread',
];

function pickShadowProp<T>(
  shadowValue: T | null | undefined,
  textShadowValue: T | null | undefined,
  defaultValue: T,
): T {
  if (shadowValue !== undefined && shadowValue !== null) {
    return shadowValue;
  }
  if (textShadowValue !== undefined && textShadowValue !== null) {
    return textShadowValue;
  }
  return defaultValue;
}

export const makeEffects = (style: ViewStyle | TextStyle): FigmaEffect[] => {
  if (!hasAnyDefined(style, SHADOW_STYLES)) {
    return [];
  }

  // `shadow*` lives on `ViewStyle`, `textShadow*` only on `TextStyle` (which
  // extends `ViewStyle`'s props), hence the `in` checks before reading them
  // off a `ViewStyle | TextStyle` value.
  const textShadowColor = 'textShadowColor' in style ? style.textShadowColor : undefined;
  const textShadowOpacity = 'textShadowOpacity' in style ? style.textShadowOpacity : undefined;
  const textShadowRadius = 'textShadowRadius' in style ? style.textShadowRadius : undefined;
  const textShadowSpread = 'textShadowSpread' in style ? style.textShadowSpread : undefined;
  const textShadowOffset = 'textShadowOffset' in style ? style.textShadowOffset : undefined;

  const color = pickShadowProp(style.shadowColor, textShadowColor, '#000');
  const opacity = pickShadowProp(style.shadowOpacity, textShadowOpacity, 1);
  const radius = pickShadowProp(style.shadowRadius, textShadowRadius, 1);
  const spread = pickShadowProp(style.shadowSpread, textShadowSpread, 0);
  const offset = pickShadowProp(style.shadowOffset, textShadowOffset, {} as { width?: number; height?: number });

  return [
    {
      type: style.shadowInner ? 'INNER_SHADOW' : 'DROP_SHADOW',
      visible: true,
      blendMode: 'NORMAL',
      color: toFigmaColor(color, opacity),
      offset: { x: offset.width || 0, y: offset.height || 0 },
      radius,
      spread,
    },
  ];
};
