# Using the initial live renderer

The renderer now supports source-save updates in a real Figma document through a local WebSocket and persistent plugin. It reuses `buildTree`, Yoga, and `buildFigmaDocument`; ordinary headless export remains available. Frames, rectangles, styled text runs, embedded images, and SVG are supported. Existing compatible nodes are updated in place; additions, deletions, reordering, reparenting and plugin restart hydration use internal occurrence identities, with optional authored native IDs.

## Start

Build the library and wrapper from the repository root:

```sh
pnpm --filter react-designapp run build:main
pnpm --filter react-figmaapp run build
```

From `tools/figma-live`, install the isolated tool dependencies (`npm install`). The previously registered `generated-plugin` folder works on the preparation host. On a new machine, create a disposable custom-UI development plugin and save its folder, as described in testing.md. Set `FIGMA_PLUGIN_DIR` to that registered folder if it is elsewhere. The dev command replaces that template's main code/UI/manifest while retaining its assigned ID and name. It must be a disposable plugin dedicated to this renderer.

Open the test-mode Figma app with the approved loopback debugging flags and select a disposable Draft. Then:

```sh
cd tools/figma-live
FIGMA_AUTO_LAUNCH=1 npm run dev -- ../../examples/strict-dom-figma/live.tsx
```

The command builds the plugin, starts an authenticated loopback WebSocket on port 3848, watches the TSX entry and its bundled imports, and automatically runs/reconnects the plugin through Playwright. A random token is generated if `FIGMA_BRIDGE_TOKEN` is omitted. With automatic launch disabled, enter the printed token in the plugin's UI and click Connect. `FIGMA_PLUGIN_NAME` defaults to the existing `react-designapp live probe` registration name. `FIGMA_DRAFT_URL` can select a specific already-open file; otherwise the first open Design file is used. `FIGMA_CDP_URL` defaults to http://127.0.0.1:9222.

Use the plugin’s Focus canvas button to zoom to the generated artwork. Saving source rebuilds and renders a fresh snapshot in an isolated Node process. Build failures appear in the terminal and plugin UI while the last successful canvas remains. Stop the watcher with Ctrl+C. WebSocket reconnect sends the current snapshot again; node metadata rebuilds the native mapping. Figma itself is not closed by the tool.

The original HTTP probe commands use port 3847 and remain separate from this live renderer.

## Authoring contract

A TSX entry default-exports a function returning a live snapshot:

```tsx
import * as React from 'react';
import { Artboard, Text, renderToLiveJSON } from 'react-designapp/figma';

export default () => renderToLiveJSON(
  <Artboard id="card" style={{ width: 320, height: 180 }}>
    <Text id="card/title" sourceId="title-declaration">Hello Figma</Text>
  </Artboard>,
  { projectId: 'my-project', rootId: 'preview' },
);
```

Identity props are optional. Use `id` for an explicit authored native identifier; `nativeID` is supported as an alias, following [React Native’s convention](https://reactnative.dev/docs/view#id). Precedence is `id` > `nativeID` > legacy `renderId`. Duplicate explicit IDs within a root fail before publication. An authored native identifier is stored in plugin provenance and maps to Figma’s assigned node ID; it does not replace the read-only Figma node.id.

Without these props, live export assigns deterministic internal `renderId` values from the parent identity and child position. Content/style/name edits preserve these IDs when structure stays the same. Explicit parent IDs anchor their anonymous descendants across movement of that parent. Inserting/reordering anonymous siblings can retarget or recreate nodes, following positional reconciliation; automatic IDs are not durable source identifiers. React `key` is currently omitted by the headless test-renderer JSON, so it cannot provide stable list identity here. For reorderable lists, use an explicit `id` derived from the domain key (for example `${product.id}/title`). Optional `sourceId` still identifies a declaration for future reverse-edit work.

An entirely anonymous tree is supported:

```tsx
export default () => renderToLiveJSON(
  <Artboard style={{ width: 320, height: 180 }}>
    <Text>Hello Figma</Text>
  </Artboard>,
  { projectId: 'my-project', rootId: 'preview' },
);
```

The exporter adds provenance only when supplied, so ordinary JSON output without these props is unchanged. Native node IDs are returned in acknowledged mappings and persist in Figma; they are never embedded in source. The live importer treats the page's exported children as contents of a dedicated managed root on the selected page. It does not replace a whole document or rename the user's page.

## Current limits

- One exported page per managed root; native auto layout is rejected. Yoga's computed positions remain authoritative.
- Reload happens on source save. React state resets between renders; this is not state-preserving Fast Refresh.
- This is one-way source → canvas synchronization. Managed properties overwrite manual edits on the next snapshot. Foreign nodes are retained, including descendants moved out of removed managed containers. Bidirectional conflict handling is deferred.
- Figma fonts are resolved by family/weight/italic. Missing fonts produce an explicit Inter Regular fallback diagnostic. Node-side text measurement is approximate, so typography can differ from native Figma metrics.
- SVG geometry changes replace the SVG root and acknowledge the new native ID. Unchanged SVG preserves its native ID. Component/instance semantics and arbitrary REST node types are outside this export schema.
- Plugin application is serialized with latest queued revision coalescing, but native mutations are not atomic. A property failure reports an error; metadata enables recovery on the next snapshot/reconnect.
- TSX and bundled local dependencies are watched. External npm/workspace packages are consumed from their built output; rebuilding those packages is a separate step. `.figma-live/` output is ignored.
- CDP launch controls were observed on Figma 126.9.11. Initial native plugin registration/save remains a setup handoff. The app's internal FIGMA_TEST flag skips some normal close confirmations; restore normal launch after testing.

## Validation

From `tools/figma-live`:

```sh
npm run test:live
# With the dev bridge running and its token:
FIGMA_BRIDGE_TOKEN=<bridge-token> npm run test:live:e2e
```

The real-app test temporarily edits the committed fixture, verifies source-save text/size changes, insertion/deletion, rich-text font runs, an image fill hash, SVG mapping, and unchanged IDs. It closes/relaunches the plugin and verifies hydration creates no nodes. It restores the fixture in finally and saves ignored local readback/screenshot evidence under artifacts/.

Verified on 2026-10-06: the card remained `4:4`, title `4:6`, panel `4:7`, body `4:8`, SVG root `4:9`, and image `4:11` through hot updates and restart. Final real-app run passed without font diagnostics. CommonJS and ES module library builds passed; four reconciliation tests passed; eight targeted Figma suites passed (13 tests). The broader Jest run passed 118 assertions/56 snapshots but four Sketch suites could not load the pre-existing node-sketch-bridge native binding on Node 22 ARM64. The existing emptyPage snapshot file also contains an obsolete CANVAS-named entry; its assertions pass, but including that file makes Jest report the obsolete snapshot. Neither pre-existing issue was modified.

## Hot reload with an already running plugin

Leave the live plugin open. Stop the previous Node watcher/bridge with Ctrl+C to release port 3848, then run from tools/figma-live:

```sh
npm run hot -- ../../examples/strict-dom-figma/live.tsx
```

This starts only the TSX watcher and WebSocket bridge. It does not read/write the plugin folder, rebuild the plugin, close/relaunch it, or connect Playwright. The existing plugin automatically reconnects with its existing token and hydrates the new bridge session. Ordinary Figma Desktop works here; test-mode/CDP is only needed for launch automation.

The token is reused from ignored artifacts/bridge-session.json, saved by subsequent dev/hot runs. For an existing session started before token caching was added, supply the token once:

```sh
FIGMA_BRIDGE_TOKEN=<token-already-entered-in-plugin> npm run hot -- ../../examples/strict-dom-figma/live.tsx
```

If the plugin was never connected, enter that same token in its UI and click Connect once. Only one watcher/bridge can own port 3848. Keep the source's projectId/rootId unchanged to reuse its native nodes. Plugin-runtime changes still require an ordinary dev build and plugin restart; hot only reloads the authored React source.

Identity update validation: eight targeted Figma suites passed (15 tests), covering anonymous IDs, id/nativeID precedence, legacy compatibility, parent anchoring, and explicit/automatic collision avoidance.

## Multiple Artboards

A Fragment containing sibling Artboards is rendered as an implicit page; all siblings are preserved. Yoga arranges ordinary siblings vertically, while explicit Page/document content retains its own supplied positioning. Containers whose children are all absolute-positioned need explicit width/height because those children do not contribute to Yoga intrinsic sizing.
