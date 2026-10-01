<div align="center">
  <img alt="react-sketchapp" src="https://cldup.com/MxSVEkc_gb.png" style="max-height:163px; width:100; height: auto; max-width:100%" />
</div>

<div align="center">
  <strong>render React components to Sketch; tailor-made for design systems</strong>
</div>

## Quick-start 🏃‍

First, make sure you have installed [Sketch](http://sketch.com) version 50+, & a recent [npm](https://nodejs.org/en/download/).

Open a new Sketch file, then in a terminal:

```bash
git clone https://github.com/airbnb/react-sketchapp.git
cd react-sketchapp/examples/basic-setup && npm install

npm run render
```

Next, [check out some more examples](https://github.com/airbnb/react-sketchapp/tree/master/examples)!

![readme-intro](https://cloud.githubusercontent.com/assets/591643/24777148/e742cd0e-1ad8-11e7-8751-090f6b2db514.png)

[![npm](https://img.shields.io/npm/v/react-sketchapp.svg)](https://www.npmjs.com/package/react-sketchapp) ![Sketch.app](https://img.shields.io/badge/Sketch.app-43--50-brightgreen.svg) [![Travis](https://img.shields.io/travis/rust-lang/rust.svg)](https://travis-ci.org/airbnb/react-sketchapp)

## Why?!

Managing the assets of design systems in Sketch is complex, error-prone and time consuming. Sketch is scriptable, but the API often changes. React provides the perfect wrapper to build reusable documents in a way already familiar to JavaScript developers.

## What does the code look like?

```js
import * as React from 'react';
import { render, Text, Artboard } from 'react-sketchapp';

const App = props => (
  <Artboard>
    <Text style={{ fontFamily: 'Comic Sans MS', color: 'hotPink' }}>{props.message}</Text>
  </Artboard>
);

export default context => {
  render(<App message="Hello world!" />, context.document.currentPage());
};
```

## What can I do with it?

- **Manage design systems—** `react-sketchapp` was built for [Airbnb’s design system](http://airbnb.design/building-a-visual-language/); this is the easiest way to manage Sketch assets in a large design system
- **Use real components for designs—** Implement your designs in code as React components and render them into Sketch
- **Design with real data—** Designing with data is important but challenging; `react-sketchapp` makes it simple to fetch and incorporate real data into your Sketch files
- **Build new tools on top of Sketch—** the easiest way to use Sketch as a canvas for custom design tooling

Found a novel use? We'd love to hear about it!

[Read more about why we built it](http://airbnb.design/painting-with-code/)

## Backends

`react-sketchapp` renders your React tree into a design-app-neutral intermediate tree (pages,
frames, shapes, text with style runs, fills, strokes, effects, auto-layout, etc.) and then hands
that tree to a **backend** that converts it to a native output format. Backend selection is
explicit, and new backends can be registered without touching the core reconciler/layout code.

Two backends ship today:

- **`sketch`** — the original, unchanged renderer. Produces Sketch file-format JSON headlessly
  (no behavior change from previous versions).
- **`figma`** — new. Produces Figma's REST-API-like file-format JSON headlessly (no Figma API/
  network calls, no live/hot renderer). A separate Figma plugin imports this JSON and creates the
  corresponding pages, frames, text, styles, etc.

### Using the Sketch backend (unchanged)

```js
import { render, renderToJSON, Text, Artboard } from 'react-sketchapp';

export default context => {
  render(<App message="Hello world!" />, context.document.currentPage());
};
```

### Using the Figma backend

```js
import * as React from 'react';
import { renderToJSON, Text, Artboard } from 'react-sketchapp/figma';

const App = () => (
  <Artboard name="Page 1">
    <Text style={{ fontFamily: 'Open Sans', fontSize: 40 }}>Hello Figma!</Text>
  </Artboard>
);

const figmaFileJSON = renderToJSON(<App />);
// write `figmaFileJSON` to disk / hand it to the Figma plugin to import
```

Or, from the main package, using `renderToFigmaJSON` directly:

```js
import { renderToFigmaJSON } from 'react-sketchapp';

const figmaFileJSON = renderToFigmaJSON()(<App />);
```

You can also pick a backend explicitly through a single, generic entry point:

```js
import { renderToDesignJSON } from 'react-sketchapp';

const json = renderToDesignJSON(<App />, { backend: 'figma' }); // or 'sketch'
```

`renderToDesignJSON`/`renderToFigmaJSON` use a pure Node.js `PlatformBridge` by default (no native
addon required), so the Figma backend — and headless Sketch JSON generation — both run in plain
Node.js environments (CI, servers, etc.) without Sketch or its native `node-sketch-bridge`
dependency installed. You may still pass a custom `PlatformBridge` (e.g. the native macOS one used
by the `sketch` backend when run inside Sketch) via the `platformBridge` option.

#### Figma JSON output format

The Figma backend outputs the same shape returned by Figma's `GET /v1/files/:key` REST endpoint:
a `document` (`DOCUMENT` → `CANVAS` pages → nodes such as `FRAME`/`RECTANGLE`/`TEXT`/`VECTOR`), plus
top-level `components`, `componentSets`, `styles`, `schemaVersion`, `name`, `version`, etc.
Frames carry Figma auto-layout fields (`layoutMode`, `paddingLeft/Right/Top/Bottom`, `itemSpacing`,
`primaryAxisAlignItems`, `counterAxisAlignItems`, `cornerRadius`, …) derived from your flexbox
styles, and text nodes carry rich-text styling via `characterStyleOverrides` +
`styleOverrideTable` when you nest `<Text>` spans with different styles. `<Svg>` trees are
serialized to a flat SVG string carried on a `VECTOR` node's `svg` field (a custom extension, since
Figma's own file format has no raw-SVG field) for the companion plugin to turn into real vector
geometry — see [Backends: SVG handling](docs/guides/backends.md#svg-handling) for details.

Generated node ids (e.g. `"1:2"`) are a JSON-document-local addressing scheme only — Figma's
plugin API does not allow assigning custom ids when creating real nodes. These generated ids are
useful as stable references inside the JSON document itself (e.g. for a future diff/update
interface built into the companion Figma plugin), but they are **not** literal Figma node ids.

### Adding a new backend (e.g. Penpot)

Backends implement the `RenderBackend` interface (`src/backends/types.ts`):

```ts
type RenderBackend<Json, Options> = {
  name: string;
  defaultPlatformBridge: PlatformBridge;
  renderToJSON: (element: React.ReactElement, options?: Options, platformBridge?: PlatformBridge) => Json;
};
```

and register themselves with the backend registry (`src/backends/registry.ts`):

```ts
import { registerBackend } from 'react-sketchapp';

registerBackend({
  name: 'penpot',
  defaultPlatformBridge: myHeadlessBridge,
  renderToJSON(element, options, platformBridge = myHeadlessBridge) {
    // build the shared intermediate tree (same `buildTree`/Yoga layout core
    // used by the Sketch and Figma backends) and emit Penpot's native format
  },
});
```

Once registered, it becomes selectable via `renderToDesignJSON(<App />, { backend: 'penpot' })`.
A Penpot backend is not implemented yet — this is only the extension point for one.

## Documentation

- [Examples](http://airbnb.io/react-sketchapp/docs/examples.html)
- [API Reference](http://airbnb.io/react-sketchapp/docs/API.html)
- [Styling](http://airbnb.io/react-sketchapp/docs/guides/styling.html)
- [Universal Rendering](http://airbnb.io/react-sketchapp/docs/guides/universal-rendering.html)
- [Data Fetching](http://airbnb.io/react-sketchapp/docs/guides/data-fetching.html)
- [FAQ](http://airbnb.io/react-sketchapp/docs/FAQ.html)
- [Contributing](https://github.com/airbnb/react-sketchapp/blob/master/.github/CONTRIBUTING.md)
