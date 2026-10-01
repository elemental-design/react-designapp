# Backends (Sketch, Figma & beyond)

`react-sketchapp` renders your React tree into a design-app-neutral intermediate tree (pages,
frames/artboards, shapes, text with style runs, images, fills, strokes, shadows/effects,
auto-layout/padding/spacing, etc.), built once from your React components + style resolution
(Yoga layout, color/style resolution, etc.). A **backend** then converts that shared tree into a
design tool's native output. Backend selection is explicit, and new backends can be registered
without changing the core reconciler/layout code.

## Built-in backends

- **`sketch`** — the original renderer, unchanged. Works headlessly and produces Sketch
  file-format JSON (`renderToJSON`).
- **`figma`** — produces Figma's REST-API-like file-format JSON, headlessly. There is no Figma
  API/network usage and no live/hot Figma renderer. A separate Figma plugin imports the generated
  JSON and creates the corresponding pages, frames, text nodes, styles, etc.

Both backends share the same `PlatformBridge` interface (`createStringMeasurer`, `findFontName`,
`makeImageDataFromUrl`). By default, headless usage (including the Figma backend) uses a pure
Node.js bridge with no native addon, so it runs anywhere Node.js runs. The Sketch backend, when
run from inside Sketch, uses the native macOS bridge instead.

## Picking a backend

```js
import { renderToDesignJSON } from 'react-sketchapp';

const sketchJSON = renderToDesignJSON(<App />, { backend: 'sketch' }); // default
const figmaJSON = renderToDesignJSON(<App />, { backend: 'figma' });
```

Or use the dedicated entry points:

```js
import { renderToJSON } from 'react-sketchapp'; // Sketch
import { renderToFigmaJSON } from 'react-sketchapp'; // Figma
import { renderToJSON as renderToFigmaFileJSON } from 'react-sketchapp/figma'; // Figma, subpath entrypoint
```

## The Figma JSON output

The Figma backend's output mirrors Figma's `GET /v1/files/:key` REST response: a `document`
(`DOCUMENT` → `CANVAS` pages → nodes), plus top-level `components`, `componentSets`, `styles`,
`schemaVersion`, `name`, `version`, etc. Frames carry Figma's auto-layout fields (`layoutMode`,
padding, `itemSpacing`, alignment, corner radius, …) derived from your flexbox styles; text nodes
carry rich-text styling via `characterStyleOverrides` + `styleOverrideTable` whenever you nest
`<Text>` spans with different styles.

Generated node ids (e.g. `"1:2"`) are only a JSON-document-local addressing scheme — the Figma
plugin API doesn't support assigning custom ids to newly created nodes. These ids are still useful
as stable references within the generated JSON itself, e.g. for a future diff/update interface in
the companion Figma plugin, but they do not correspond to real Figma-assigned node ids.

## Adding a new backend (e.g. Penpot)

A backend is a plain object implementing `RenderBackend`:

```ts
type RenderBackend<Json, Options> = {
  name: string;
  defaultPlatformBridge: PlatformBridge;
  renderToJSON: (
    element: React.ReactElement,
    options?: Options,
    platformBridge?: PlatformBridge,
  ) => Json;
};
```

Register it with the shared registry:

```js
import { registerBackend } from 'react-sketchapp';

registerBackend({
  name: 'penpot',
  defaultPlatformBridge: myHeadlessBridge,
  renderToJSON(element, options, platformBridge = myHeadlessBridge) {
    // build the shared intermediate tree (the same `buildTree`/Yoga layout
    // core used by the Sketch and Figma backends) and emit Penpot's native
    // JSON format
  },
});
```

Once registered, the backend becomes selectable via
`renderToDesignJSON(<App />, { backend: 'penpot' })`. No Penpot backend ships today — this is only
the extension point for one.
