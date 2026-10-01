import { TextStyle } from '../../types';

// Pure JS re-implementation of the native `findFontName` bridge method.
// It does not need to resolve a *real* installed font the way the macOS
// bridge does (via NSFont/NSFontManager) -- it only needs to produce a
// stable, descriptive PostScript-style font name that design tools
// (Sketch, Figma, ...) can use to look up (or at least label) the font.
//
// This borrows the weight-name table used across the codebase so that the
// generated names look like what a real font manager would produce, e.g.
// `OpenSans-ExtraBoldItalic`.

const WEIGHT_NAMES: { [weight: number]: string } = {
  100: 'Thin',
  200: 'ExtraLight',
  300: 'Light',
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
  700: 'Bold',
  800: 'ExtraBold',
  900: 'Black',
};

const NAMED_WEIGHTS: { [name: string]: number } = {
  ultralight: 100,
  thin: 100,
  light: 300,
  normal: 400,
  regular: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  heavy: 800,
  black: 900,
};

export function resolveFontWeight(style: TextStyle): number {
  const { fontWeight } = style;

  if (fontWeight === undefined || fontWeight === null) {
    return 400;
  }

  const numeric = Number(fontWeight);
  if (!Number.isNaN(numeric)) {
    // round to the nearest multiple of 100 supported by WEIGHT_NAMES
    return Math.min(900, Math.max(100, Math.round(numeric / 100) * 100));
  }

  const named = NAMED_WEIGHTS[String(fontWeight).toLowerCase()];
  return named || 400;
}

export function isItalicStyle(style: TextStyle): boolean {
  // `fontStyle` is typed as `'normal' | 'italic'` (see TextStylePropTypes),
  // but guard against 'oblique' too in case a raw/untyped style object is
  // passed in (e.g. from JS consumers, or Document-style shared styles).
  return style.fontStyle === 'italic' || (style.fontStyle as string) === 'oblique';
}

export function findFontName(style: TextStyle): string {
  const family = (style.fontFamily || 'Arial').replace(/\s+/g, '');
  const weight = resolveFontWeight(style);
  const weightName = WEIGHT_NAMES[weight] || 'Regular';
  const italic = isItalicStyle(style);

  let suffix = weightName;
  if (italic) {
    suffix = weightName === 'Regular' ? 'Italic' : `${weightName}Italic`;
  }

  return `${family}-${suffix}`;
}
