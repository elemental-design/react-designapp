# react-strict-dom-figma

Static `css` and `html` primitives backed by `react-figmaapp`. Render a shared
component tree to Figma REST-shaped JSON without Sketch.app or a Figma session.
The JSON can be consumed by the repository's Figma importer; generation itself
does not create nodes in a live Figma document.

```js
const React = require('react');
const { css, html } = require('react-strict-dom-figma');
const { renderToJSON } = require('react-figmaapp');

const styles = css.create({
  button: { display: 'flex', backgroundColor: 'darkgreen', gap: '0.25rem',
    paddingBlock: 8, paddingInline: 32 },
  text: { color: 'white', fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold' },
});
const button = React.createElement(html.button, { style: styles.button },
  React.createElement(html.span, { style: styles.text }, 'Continue'),
  React.createElement(html.span, { style: styles.text }, '(shared)'));
const file = renderToJSON(button);
```

For shared code that imports from `react-strict-dom`, configure your Figma build's
module resolver to alias that import to `react-strict-dom-figma`. This adapter
expects uncompiled style objects; do not run the web StyleX transform on the
Figma build.

## Examples and tests

From the monorepo root:

```sh
pnpm install
pnpm build
pnpm --filter react-strict-dom-figma test:unit
pnpm --filter strict-dom-figma-example generate
```

The gallery in `examples/strict-dom-figma` includes the shared button, nested
inherited typography, form controls and an embedded image. The generator writes
`examples/strict-dom-figma/strict-dom-figma.json`; pass a path after `generate` to
choose another destination. Tests check host primitives and the exported Figma
nodes, text styles and measured bounds.

## Supported behavior and limits

- View tags become `View`; text tags become `Text`; `img` becomes `Image`.
  `input` and `textarea` display static values, defaults or placeholders.
  Password values are masked; hidden elements are omitted.
- Nested arrays and falsy style entries are supported. Logical padding/margin
  use left-to-right mapping. `px`, `rem` and `em` lengths are converted, with
  `rem` and `em` fixed at 16 pixels. Numeric dimensions emulate content-box
  sizing unless `boxSizing: 'border-box'` is provided.
- Text styles inherit through views and nested text. `textDecorationLine` maps
  to the renderer's `textDecoration`. Export support depends on the underlying
  Figma serializer.
- Flex defaults to a row; block layout is approximated with a column. Yoga 1
  lacks gap, so spacing is added to child margins. This approximation is for
  non-wrapping rows/columns whose direct children forward their `style` prop;
  custom components that ignore `style` and hidden children can affect gaps.
- `css.create` resolves static objects. `defineVars` and `createTheme` return
  plain values, without CSS variable substitution. Conditional styles warn and
  are omitted; `keyframes` throws. Events, focus, refs, animation and interactive
  form behavior are outside the static renderer's scope.

The TSX example forwards `style` to each custom component root so container gaps
are preserved. The gallery explicitly sets a white background; unstyled HTML
containers remain transparent. Inputs use a frame for background, border and
padding, with a separate text child. Arial ASCII glyph widths are measured from
font advances to avoid short labels wrapping; other fonts still use estimates.
