# Strict DOM component gallery

From the monorepo root, run:

```sh
pnpm build
pnpm --filter strict-dom-figma-example generate
pnpm --filter react-strict-dom-figma test:unit
```

The generator writes `strict-dom-figma.json` with one page and eight separate
440 × 660 frames arranged on a three-column grid:

| Frame | Examples |
| --- | --- |
| Shared primitives | Original shared button, typography, form and image |
| Inputs — Light | Placeholder, focused, verified, invalid and disabled |
| Inputs — Dark | The same five states on a dark surface |
| Menu | Grouped rows, subtitles, values, selected, disabled, destructive |
| Radio | Selected, unselected, descriptions and disabled options |
| Switches | On, off and disabled settings |
| Tabs and badges | Selected tabs, neutral/accent/success/danger badges, device card |
| Feedback | Error banner, retry button, success banner, 65% progress |

`showcase.tsx` exports the individual example sections and `ComponentGallery`.
`components.tsx` retains the original examples. `generate.tsx` renders the
multi-frame document through `react-figmaapp.renderToJSON`. Pass an output path
following `generate` to choose a different JSON destination.

The patterns are inspired by [Altersend's components at the referenced commit](https://github.com/denislupookov/altersend/tree/ead93281d314581afc2f0ef9310aecc1f5c391ad/packages/components/src/components),
particularly Input, Menu, Radio, ToggleSwitch, Tabs, Badge and ErrorBanner.
These are independent static adaptations using local colors and Arial, without
Altersend's runtime theme, hooks or animation dependencies. Focus, selection,
validation and disabled appearances are explicit props, not live interactions.

The output is Figma REST-shaped JSON for an importer. Layout uses Yoga and
Node font measurement. Tests check frame bounds, spacing, fills, selected radio
dots, switch positions, and progress geometry. A live Figma import is still
needed to verify importer-specific behavior and final font rendering.

Rounded menu cards use `overflow: 'hidden'`, exported as `clipsContent: true`.
The importer must apply both `cornerRadius` and `clipsContent` to the Figma frame
so row backgrounds stay inside the rounded outline; a separate mask is not needed.
