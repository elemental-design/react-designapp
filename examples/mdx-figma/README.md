# MDX document → React Designapp → Figma JSON

This example renders one MDX document through the existing `react-strict-dom-figma` adapter and React Designapp's headless Figma serializer. Headings, rich text, lists, code and imported TSX components become design nodes. Markdown rules remain rules; this example does not split slides or implement presentation frames.

## Run

Use Node 22 or newer. Clone `react-platform` beside `react-designapp` for the unpublished `@react-platform/mdx` link. Install dependencies in both repositories (for this headless workflow, `pnpm install --ignore-scripts` avoids running legacy native/Sketch setup), then from React Designapp:

```sh
pnpm example:mdx
```

This builds the shared compiler and existing Figma packages, then writes `examples/mdx-figma/document.figma.json`. A custom input and output can be passed through:

```sh
pnpm example:mdx /absolute/path/article.mdx /absolute/path/article.figma.json
```

After packages are built, the faster generator is:

```sh
pnpm --filter mdx-figma-example generate
pnpm --filter mdx-figma-example test:ci
```

The serialized output is **Figma REST-shaped JSON with the renderer's custom payload extensions**. It is not a `.fig` file and this command does not create nodes in a live Figma document. Use the existing importer/Plugin API workflow separately; no live Figma import has been validated for this example.

## How it works

- `document.mdx` is ordinary document authoring with YAML metadata and a relative TSX import.
- `@react-platform/mdx/esbuild` compiles it into a React component plus a named `frontmatter` export. It does not choose the renderer.
- `theme.tsx` supplies a Markdown component map and a 960px document layout using upstream `react-strict-dom` imports and raw styles.
- `generate.mjs` aliases `react-strict-dom` to the existing Figma polyfill and bundles the local Figma host. Third-party Node dependencies stay external. It resolves every React/JSX-runtime/TestRenderer import to the example's matching React 19.2.0 pair so the legacy packages' development React instances cannot enter this render graph.
- The document is mounted in one auto-height Artboard on one Page. This is a document container, not a slide abstraction. The host's existing Yoga/font/serializer pipeline creates the JSON.

No browser StyleX transform is used. Use the original TSX and uncompiled styles. The component map is the renderer boundary: explicit DOM JSX, browser hooks and browser-only components are outside this example. The [Figma polyfill's limits](../../packages/react-strict-dom-figma/README.md) still apply, including approximate layout/font measurement, static controls, limited styles and gap handling. Its numeric line heights use design units rather than upstream's unitless multipliers; this example relies on the host's font defaults.

The existing serializer uses React Test Renderer and emits its React 19 deprecation notice. Matching the renderer version and producing headless JSON are tested; this does not establish live Figma or React Native device compatibility.

Tests check the real headless serialization: one document container despite a Markdown rule, imported TSX content, font sizes, inline style overrides, positive text bounds and malformed input rejection. Frame-per-slide Figma export belongs to a future `mdx-slides` adapter. Once more document consumers exist, the example's host-binding code can become a small package in React Designapp; there is no new renderer implementation here.
