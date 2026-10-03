import normalizeColor, { rgba } from 'normalize-css-color';
import { Color } from '../../types';
import { FigmaColor } from './types';

// Converts a CSS color (hex, named, rgb(a), hsl(a)) into the normalized
// `{ r, g, b, a }` (0-1) format used throughout the Figma REST JSON schema.
export const toFigmaColor = (input: Color, alpha: number = 1): FigmaColor => {
  const normalized: Color = typeof input === 'string' ? input.toLowerCase() : input;
  const nullableColor = normalizeColor(normalized);
  const colorInt: number = nullableColor == null ? 0x00000000 : nullableColor;
  const { r, g, b, a } = rgba(colorInt);

  return {
    r: r / 255,
    g: g / 255,
    b: b / 255,
    a: a * alpha,
  };
};
