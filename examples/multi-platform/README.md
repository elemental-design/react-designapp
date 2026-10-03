# Multi-platform

Renders a color-swatch page headlessly to Figma file-format JSON — no Figma account, API, or desktop app needed.

## How to use

```bash
npm install
npm run generate
```

This writes `multi-platform-figma.json` next to the example. The generated JSON is a Figma document (pages, frames, text nodes, fills), ready to be imported into Figma via a plugin or consumed by other tools.

## The idea behind the example

The same React tree can be rendered to different design-tool formats. This example uses `renderToDesignJSON(<Document />, { backend: 'figma' })` to emit Figma-format JSON; passing `{ backend: 'sketch' }` would emit Sketch-format JSON instead. Nodes use Figma's default `MIN`/`MIN` layout constraints unless customized. Text layout is measured with the pure-Node platform bridge, so this runs on any machine without native bindings.
