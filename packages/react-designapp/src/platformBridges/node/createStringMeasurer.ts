import { Size, TextNode } from '../../types';
import { resolveFontWeight } from './findFontName';
import { arialWidth } from './arialWidths';

// Pure JS re-implementation of the native `createStringMeasurer` bridge
// method. Real font metrics aren't available without native font APIs
// (NSFont, CoreText, ...), so this uses a reasonable heuristic based on
// average glyph advance widths relative to font size. It is good enough to
// drive headless layout for design-app-agnostic backends (e.g. Figma) and
// for running the renderer in plain Node.js (CI, tests, server-side
// generation) without any native dependency.

// Average glyph advance as a ratio of font size, for a "regular" weight.
// Calibrated against real macOS (NSLayoutManager) measurements: e.g. a 152-char
// mixed-case English string in Georgia 16 measures 1104pt wide => ~0.454.
const AVERAGE_CHAR_WIDTH_RATIO = 0.46;
// Every 100 of font-weight above 400 nudges characters a bit wider.
const WEIGHT_WIDTH_FACTOR = 0.00025;
// Approximate advance of an emoji (or other non-BMP/wide symbol) as a ratio of
// font size. Emojis are rendered roughly square, so ~1.0 is close; counting
// them by UTF-16 code units instead would double-count them and inflate line
// widths (and therefore wrap counts).
const EMOJI_CHAR_WIDTH_RATIO = 1.0;

function charWidthRatio(weight: number): number {
  const weightAdjustment = (weight - 400) * WEIGHT_WIDTH_FACTOR;
  return AVERAGE_CHAR_WIDTH_RATIO + weightAdjustment;
}

// Surrogate pair or variation-selector sequence => an emoji/symbol glyph.
function isWideCodePoint(codePoint: number): boolean {
  return (
    codePoint > 0xffff ||
    (codePoint >= 0x2600 && codePoint <= 0x27bf) || // misc symbols & dingbats
    (codePoint >= 0x2190 && codePoint <= 0x2bff) // arrows, misc technical, etc.
  );
}

function measureLineWidth(
  line: string,
  fontSize: number,
  weight: number,
  letterSpacing: number,
  fontFamily: string,
) {
  if (line.length === 0) {
    return 0;
  }
  const ratio = charWidthRatio(weight);
  // Measure in code points (not UTF-16 units) so emoji count once, not twice.
  const segments = Array.from(line);
  let glyphWidth = 0;
  segments.forEach((segment) => {
    const codePoint = segment.codePointAt(0) as number;
    const measured = /^Arial$/i.test(fontFamily) ? arialWidth(segment, weight) : undefined;
    const segmentRatio = measured ?? (isWideCodePoint(codePoint) ? EMOJI_CHAR_WIDTH_RATIO : ratio);
    glyphWidth += fontSize * segmentRatio;
  });
  const spacing = letterSpacing * Math.max(0, segments.length - 1);
  return glyphWidth + spacing;
}

function wrapLine(
  line: string,
  fontSize: number,
  weight: number,
  letterSpacing: number,
  maxWidth: number,
  fontFamily: string,
): string[] {
  if (
    !Number.isFinite(maxWidth) ||
    maxWidth <= 0 ||
    measureLineWidth(line, fontSize, weight, letterSpacing, fontFamily) <= maxWidth
  ) {
    return [line];
  }

  const words = line.split(' ');
  const wrapped: string[] = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (
      measureLineWidth(candidate, fontSize, weight, letterSpacing, fontFamily) > maxWidth &&
      current.length > 0
    ) {
      wrapped.push(current);
      current = word;
    } else {
      current = candidate;
    }
  });

  if (current.length > 0 || wrapped.length === 0) {
    wrapped.push(current);
  }

  return wrapped;
}

export function createStringMeasurer(textNodes: TextNode[], maxWidth: number): Size {
  // Each text node may contain explicit newlines; split the whole run into
  // logical lines first (carrying over the styling of the run that started
  // the line), then word-wrap each line against maxWidth.
  let width = 0;
  let height = 0;

  let pendingLine = '';
  let pendingFontSize = 14;
  let pendingFontFamily = 'Arial';
  let pendingWeight = 400;
  let pendingLineHeight = 0;
  let pendingLetterSpacing = 0;

  const flush = () => {
    const lines = wrapLine(
      pendingLine,
      pendingFontSize,
      pendingWeight,
      pendingLetterSpacing,
      maxWidth,
      pendingFontFamily,
    );
    const lineHeight = pendingLineHeight || pendingFontSize * 1.2;
    lines.forEach((line) => {
      width = Math.max(
        width,
        measureLineWidth(
          line,
          pendingFontSize,
          pendingWeight,
          pendingLetterSpacing,
          pendingFontFamily,
        ),
      );
      height += lineHeight;
    });
    pendingLine = '';
  };

  textNodes.forEach((textNode) => {
    const { content, textStyles } = textNode;
    const fontSize = textStyles.fontSize || 14;
    const weight = resolveFontWeight(textStyles);
    const lineHeight = textStyles.lineHeight || 0;
    const letterSpacing = textStyles.letterSpacing || 0;

    pendingFontSize = fontSize;
    pendingFontFamily = textStyles.fontFamily || 'Arial';
    pendingWeight = weight;
    pendingLineHeight = lineHeight;
    pendingLetterSpacing = letterSpacing;

    const segments = content.split('\n');
    segments.forEach((segment, index) => {
      if (index > 0) {
        flush();
      }
      pendingLine += segment;
    });
  });

  flush();

  return { width: Math.ceil(width), height: Math.ceil(height) };
}
