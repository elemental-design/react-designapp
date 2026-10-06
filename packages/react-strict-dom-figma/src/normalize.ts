import { warn } from './warn';

type Style = Record<string, any>;

const REM = 16;

const toPx = (v: any) => {
  if (typeof v !== 'string') return v;
  const match = /^(-?(?:\d+(?:\.\d+)?|\.\d+))(rem|em|px)$/.exec(v.trim());
  if (match) return Number(match[1]) * (match[2] === 'px' ? 1 : REM);
  return v;
};

// Flatten RSD style arrays, drop falsy entries, drop conditional keys
export function flatten(style: any): Style {
  if (!style) return {};
  if (Array.isArray(style)) {
    return style.reduce((a, s) => ({ ...a, ...flatten(s) }), {});
  }
  const out: Style = {};
  for (const [k, v] of Object.entries(style)) {
    if (k.startsWith(':') || k.startsWith('@')) {
      warn(`unsupported conditional style "${k}"`);
      continue;
    }
    out[k] = v;
  }
  return out;
}

const expand = (s: Style, logical: string, a: string, b: string) => {
  if (s[logical] == null) return;
  if (s[a] == null) s[a] = s[logical];
  if (s[b] == null) s[b] = s[logical];
  delete s[logical];
};

export function normalize(input: any): Style {
  const s: Style = {};
  for (const [k, v] of Object.entries(flatten(input))) s[k] = toPx(v);

  // Logical -> physical
  expand(s, 'paddingBlock', 'paddingTop', 'paddingBottom');
  expand(s, 'paddingInline', 'paddingLeft', 'paddingRight');
  expand(s, 'marginBlock', 'marginTop', 'marginBottom');
  expand(s, 'marginInline', 'marginLeft', 'marginRight');
  for (const prefix of ['padding', 'margin']) {
    for (const [logical, physical] of [
      ['BlockStart', 'Top'],
      ['BlockEnd', 'Bottom'],
      ['InlineStart', 'Left'],
      ['InlineEnd', 'Right'],
    ]) {
      const key = prefix + logical;
      if (s[key] != null) s[prefix + physical] = s[key];
      delete s[key];
    }
  }
  if (s.textDecorationLine != null) {
    s.textDecoration = s.textDecorationLine;
    delete s.textDecorationLine;
  }

  // content-box -> border-box (Yoga is border-box)
  if (s.boxSizing !== 'border-box') {
    const px = (a: any, b: any) =>
      (typeof a === 'number' ? a : 0) + (typeof b === 'number' ? b : 0);
    const h =
      px(
        s.paddingLeft ?? s.paddingHorizontal ?? s.padding,
        s.paddingRight ?? s.paddingHorizontal ?? s.padding,
      ) + px(s.borderLeftWidth ?? s.borderWidth, s.borderRightWidth ?? s.borderWidth);
    const v =
      px(
        s.paddingTop ?? s.paddingVertical ?? s.padding,
        s.paddingBottom ?? s.paddingVertical ?? s.padding,
      ) + px(s.borderTopWidth ?? s.borderWidth, s.borderBottomWidth ?? s.borderWidth);
    if (typeof s.width === 'number') s.width += h;
    if (typeof s.height === 'number') s.height += v;
  }
  delete s.boxSizing;

  // Unsupported or no-op in a static design tool
  for (const k of [
    'borderBottomStyle',
    'borderStyle',
    'cursor',
    'position',
    'direction',
    'transition',
    'userSelect',
  ]) {
    if (k === 'position' && s[k] !== 'static') continue;
    delete s[k];
  }
  return s;
}
