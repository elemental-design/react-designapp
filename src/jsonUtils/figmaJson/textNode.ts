import { TextNode as FlexTextNode, TreeNode } from '../../types';
import { makeFigmaTextStyle } from './textStyle';
import { makeFills } from './paint';
import { toFigmaColor } from './colors';
import { FigmaRect, FigmaTextNode, FigmaTextStyle } from './types';

function diffTextStyle(
  base: FigmaTextStyle,
  run: FigmaTextStyle,
): Partial<FigmaTextStyle> {
  const diff: Partial<FigmaTextStyle> = {};

  // `FigmaTextStyle`'s fields are all primitives (string/number/boolean), so
  // `!==` here is a correct, exact equality check. If a future field is
  // added to `FigmaTextStyle` that holds an object/array, this comparison
  // would become referential rather than deep and could report false
  // differences for deeply-equal values -- switch to a deep-equal check at
  // that point.
  (Object.keys(run) as (keyof FigmaTextStyle)[]).forEach(<K extends keyof FigmaTextStyle>(key: K) => {
    if (run[key] !== base[key]) {
      diff[key] = run[key];
    }
  });

  return diff;
}

// Builds a Figma TEXT node, including `characterStyleOverrides` /
// `styleOverrideTable` for nested <Text> runs with different styling
// (color, size, weight, line-height, ...), matching the behavior of
// react-sketchapp's Sketch text layers (whose base style is also the first
// text run's resolved style -- see `makeTextLayer`).
export function buildTextNode(
  node: TreeNode,
  id: string,
  name: string,
  box: FigmaRect,
): FigmaTextNode {
  const textNodesList: FlexTextNode[] = node.props.textNodes.length
    ? node.props.textNodes
    : [{ content: '', textStyles: {} }];

  const baseTextStyles = textNodesList[0].textStyles || {};
  const baseFigmaStyle = makeFigmaTextStyle(baseTextStyles);
  const characters = textNodesList.map((run) => run.content).join('');

  const styleOverrideTable: FigmaTextNode['styleOverrideTable'] = {};
  const characterStyleOverrides: number[] = [];
  const keyCache = new Map<string, number>();
  let nextKey = 1;

  textNodesList.forEach((run) => {
    const runFigmaStyle = makeFigmaTextStyle(run.textStyles || {});
    const diff: Partial<FigmaTextStyle> & { fills?: ReturnType<typeof makeFills> } = diffTextStyle(
      baseFigmaStyle,
      runFigmaStyle,
    );

    if (run.textStyles && run.textStyles.color !== baseTextStyles.color) {
      diff.fills = [
        {
          blendMode: 'NORMAL',
          type: 'SOLID',
          color: toFigmaColor(run.textStyles.color || 'black'),
        },
      ];
    }

    let key = 0;
    if (Object.keys(diff).length > 0) {
      const cacheKey = JSON.stringify(diff);
      const cached = keyCache.get(cacheKey);
      if (cached !== undefined) {
        key = cached;
      } else {
        key = nextKey;
        nextKey += 1;
        keyCache.set(cacheKey, key);
        styleOverrideTable[key] = diff;
      }
    }

    for (let i = 0; i < run.content.length; i += 1) {
      characterStyleOverrides.push(key);
    }
  });

  const lines = characters.split('\n');
  const fills = makeFills({ ...baseTextStyles, backgroundColor: baseTextStyles.color || 'black' });

  return {
    id,
    name,
    type: 'TEXT',
    scrollBehavior: 'SCROLLS',
    blendMode: 'PASS_THROUGH',
    absoluteBoundingBox: box,
    absoluteRenderBounds: box,
    constraints: { vertical: 'TOP', horizontal: 'LEFT' },
    relativeTransform: [
      [1, 0, node.layout.left],
      [0, 1, node.layout.top],
    ],
    size: { x: node.layout.width, y: node.layout.height },
    fills: fills.length ? fills : [{ blendMode: 'NORMAL', type: 'SOLID', color: toFigmaColor('black') }],
    fillGeometry: [],
    strokes: [],
    strokeWeight: 1,
    strokeAlign: 'OUTSIDE',
    strokeGeometry: [],
    exportSettings: [],
    effects: [],
    characters,
    style: baseFigmaStyle,
    characterStyleOverrides,
    styleOverrideTable,
    lineTypes: lines.map(() => 'NONE'),
    lineIndentations: lines.map(() => 0),
  };
}
