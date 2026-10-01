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
  const color =
    style.borderColor ||
    style.borderTopColor ||
    style.borderRightColor ||
    style.borderBottomColor ||
    style.borderLeftColor;
  const width =
    style.borderWidth ||
    style.borderTopWidth ||
    style.borderRightWidth ||
    style.borderBottomWidth ||
    style.borderLeftWidth;

  if (!color || !width) {
    return { strokes: [], strokeWeight: 1 };
  }

  return {
    strokes: [{ blendMode: 'NORMAL', type: 'SOLID', color: toFigmaColor(color) }],
    strokeWeight: width,
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

export const makeEffects = (style: ViewStyle | TextStyle): FigmaEffect[] => {
  if (!hasAnyDefined(style, SHADOW_STYLES)) {
    return [];
  }

  const color =
    style.shadowColor ||
    ('textShadowColor' in style && style.textShadowColor) ||
    '#000';
  const opacity =
    style.shadowOpacity !== undefined && style.shadowOpacity !== null
      ? style.shadowOpacity
      : 'textShadowOpacity' in style && style.textShadowOpacity !== undefined
      ? (style.textShadowOpacity as number)
      : 1;
  const radius =
    style.shadowRadius !== undefined && style.shadowRadius !== null
      ? style.shadowRadius
      : 'textShadowRadius' in style && style.textShadowRadius !== undefined
      ? (style.textShadowRadius as number)
      : 1;
  const spread =
    style.shadowSpread !== undefined && style.shadowSpread !== null
      ? style.shadowSpread
      : 'textShadowSpread' in style && style.textShadowSpread !== undefined
      ? (style.textShadowSpread as number)
      : 0;
  const offset =
    style.shadowOffset || ('textShadowOffset' in style && style.textShadowOffset) || {};

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
