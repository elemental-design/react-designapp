import { Size, TextNode } from '../../types';
import { resolveFontWeight } from './findFontName';

// Pure JS re-implementation of the native `createStringMeasurer` bridge
// method. Real font metrics aren't available without native font APIs
// (NSFont, CoreText, ...), so this uses a reasonable heuristic based on
// average glyph advance widths relative to font size. It is good enough to
// drive headless layout for design-app-agnostic backends (e.g. Figma) and
// for running the renderer in plain Node.js (CI, tests, server-side
// generation) without any native dependency.

// Average glyph width as a ratio of font size, for a "regular" weight.
const AVERAGE_CHAR_WIDTH_RATIO = 0.52;
// Every 100 of font-weight above 400 nudges characters a bit wider.
const WEIGHT_WIDTH_FACTOR = 0.00025;

function charWidthRatio(fontSize: number, weight: number): number {
  const weightAdjustment = (weight - 400) * WEIGHT_WIDTH_FACTOR;
  return AVERAGE_CHAR_WIDTH_RATIO + weightAdjustment;
}

function measureLineWidth(line: string, fontSize: number, weight: number, letterSpacing: number) {
  if (line.length === 0) {
    return 0;
  }
  const ratio = charWidthRatio(fontSize, weight);
  const glyphWidth = line.length * fontSize * ratio;
  const spacing = letterSpacing * Math.max(0, line.length - 1);
  return glyphWidth + spacing;
}

function wrapLine(line: string, fontSize: number, weight: number, letterSpacing: number, maxWidth: number): string[] {
  if (!Number.isFinite(maxWidth) || maxWidth <= 0 || measureLineWidth(line, fontSize, weight, letterSpacing) <= maxWidth) {
    return [line];
  }

  const words = line.split(' ');
  const wrapped: string[] = [];
  let current = '';

  words.forEach((word) => {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (measureLineWidth(candidate, fontSize, weight, letterSpacing) > maxWidth && current.length > 0) {
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
  let pendingWeight = 400;
  let pendingLineHeight = 0;
  let pendingLetterSpacing = 0;

  const flush = () => {
    const lines = wrapLine(pendingLine, pendingFontSize, pendingWeight, pendingLetterSpacing, maxWidth);
    const lineHeight = pendingLineHeight || pendingFontSize * 1.2;
    lines.forEach((line) => {
      width = Math.max(width, measureLineWidth(line, pendingFontSize, pendingWeight, pendingLetterSpacing));
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
