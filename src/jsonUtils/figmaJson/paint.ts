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
      color: toFigmaColor(style.backgroundColor, isDefinedOpacity(style)),
    },
  ];
};

function isDefinedOpacity(style: ViewStyle | TextStyle): number {
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
  style: ViewStyle | TextStyle,
  shadowProp: 'shadowColor' | 'shadowOpacity' | 'shadowRadius' | 'shadowSpread' | 'shadowOffset',
  textShadowProp:
    | 'textShadowColor'
    | 'textShadowOpacity'
    | 'textShadowRadius'
    | 'textShadowSpread'
    | 'textShadowOffset',
  defaultValue: T,
): T {
  const value = (style as Record<string, unknown>)[shadowProp];
  if (value !== undefined && value !== null) {
    return value as T;
  }
  const textValue =
    textShadowProp in style ? (style as Record<string, unknown>)[textShadowProp] : undefined;
  if (textValue !== undefined && textValue !== null) {
    return textValue as T;
  }
  return defaultValue;
}

export const makeEffects = (style: ViewStyle | TextStyle): FigmaEffect[] => {
  if (!hasAnyDefined(style, SHADOW_STYLES)) {
    return [];
  }

  const color = pickShadowProp(style, 'shadowColor', 'textShadowColor', '#000');
  const opacity = pickShadowProp(style, 'shadowOpacity', 'textShadowOpacity', 1);
  const radius = pickShadowProp(style, 'shadowRadius', 'textShadowRadius', 1);
  const spread = pickShadowProp(style, 'shadowSpread', 'textShadowSpread', 0);
  const offset = pickShadowProp<{ width?: number; height?: number }>(
    style,
    'shadowOffset',
    'textShadowOffset',
    {},
  );

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
