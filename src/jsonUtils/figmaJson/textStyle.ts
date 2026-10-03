import { TextStyle } from '../../types';
import { findFontName, resolveFontWeight, isItalicStyle } from '../../platformBridges/node/findFontName';
import { FigmaTextStyle } from './types';

const TEXT_ALIGN_HORIZONTAL: { [key: string]: FigmaTextStyle['textAlignHorizontal'] } = {
  auto: 'LEFT',
  left: 'LEFT',
  right: 'RIGHT',
  center: 'CENTER',
  justify: 'JUSTIFIED',
};

// Builds the `style` object for a Figma TEXT node (or a style-override
// table entry) from a resolved react-sketchapp TextStyle.
export const makeFigmaTextStyle = (style: TextStyle): FigmaTextStyle => {
  const fontSize = style.fontSize || 14;
  const lineHeightPx = style.lineHeight || fontSize * 1.2;

  return {
    fontFamily: style.fontFamily || 'Arial',
    fontPostScriptName: findFontName(style),
    italic: isItalicStyle(style),
    fontWeight: resolveFontWeight(style),
    fontSize,
    textAlignHorizontal: TEXT_ALIGN_HORIZONTAL[style.textAlign || 'auto'] || 'LEFT',
    textAlignVertical: 'TOP',
    letterSpacing: style.letterSpacing || 0,
    lineHeightPx,
    lineHeightPercent: 100,
    lineHeightUnit: 'INTRINSIC_%',
  };
};
