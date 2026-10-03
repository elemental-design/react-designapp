import { warn } from './warn';

type Style = Record<string, any>;

const REM = 16;

const toPx = (v: any) => {
  if (typeof v !== 'string') return v;
  if (v.endsWith('rem') || v.endsWith('em')) return parseFloat(v) * REM;
  if (v.endsWith('px')) return parseFloat(v);
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
  s[a] ??= s[logical];
  s[b] ??= s[logical];
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
  expand(s, 'paddingBlockStart', 'paddingTop', 'paddingTop');
  if (s.paddingInlineStart != null) s.paddingLeft ??= s.paddingInlineStart;
  if (s.paddingInlineEnd != null) s.paddingRight ??= s.paddingInlineEnd;
  delete s.paddingInlineStart;
  delete s.paddingInlineEnd;
  delete s.paddingBlockStart;

  // content-box -> border-box (Yoga is border-box)
  if (s.boxSizing !== 'border-box') {
    const px = (a?: number, b?: number) => (a ?? 0) + (b ?? 0);
    const h = px(s.paddingLeft ?? s.paddingHorizontal, s.paddingRight ?? s.paddingHorizontal)
      + px(s.borderLeftWidth ?? s.borderWidth, s.borderRightWidth ?? s.borderWidth);
    const v = px(s.paddingTop ?? s.paddingVertical, s.paddingBottom ?? s.paddingVertical)
      + px(s.borderTopWidth ?? s.borderWidth, s.borderBottomWidth ?? s.borderWidth);
    if (typeof s.width === 'number') s.width += h;
    if (typeof s.height === 'number') s.height += v;
  }
  delete s.boxSizing;

  // Unsupported or no-op in a static design tool
  for (const k of ['borderBottomStyle', 'borderStyle', 'cursor', 'overflow',
    'position', 'direction', 'transition', 'userSelect']) {
    if (k === 'position' && s[k] !== 'static') continue;
    delete s[k];
  }
  return s;
}
