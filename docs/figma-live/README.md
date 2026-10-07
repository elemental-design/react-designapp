# Live Figma renderer

Status: initial live renderer implemented and tested against Figma Desktop; bidirectional synchronization remains planned. Research date: 2026-10-06.

Read [spec](spec.md), [implementation plan](plan.md), and [end-to-end environment](testing.md). No Figma MCP is involved. Local development plugins render into editable disposable Drafts.

Verified here: upstream source inspection, local probe syntax, HTTP transport tests. Verified against real Figma: test-mode startup, CDP attachment, quick actions and plugin creation UI. Verified end-to-end: registered plugin run, two native frame updates, automatic relaunch and persisted identity after restart. Initial native save was completed by the user; separate manifest import was unnecessary. Figma Desktop 126.9.11 is now installed at `/Applications/Figma.app`. Playwright attachment is now verified when launched with `FIGMA_TEST=1`. Its original running process did not have debugging arguments. `open -a ... --args --remote-debugging-port=9222` returned successfully but no CDP listener appeared, consistent with arguments being absorbed by an existing instance. A fresh direct launch also refused CDP connections. Installed app code explicitly removes the port unless `FIGMA_TEST` is set; the user approved the test-mode experiment and it successfully exposed CDP. Computer Use reported that permissions are not granted, so native UI inspection/normal quit was unavailable. An authenticated empty Untitled file was restored; the custom-UI plugin creation flow reached the native save step. Plugin execution, in-place native mutation, automated relaunch and restart hydration all passed with node ID `4:2`.

Upstream source baselines:
- json-to-figma feat/figma-fixes: `224c734f56a2f24573f08fa5b1f6aed8640feeab`.
- react-figma: `1fd2d9d7ed4fbdb3c217d17a171432df9a506819`.

The importer creates native nodes and has font/image/SVG support. It also rebuilds INSTANCE records as frames, catches property assignment errors, and uses a heuristic image cache key. Production integration must address these limitations rather than treating it as lossless import. react-figma hydration matches type and sibling position. Its HMR documentation explicitly requires an already running plugin. Its Yoga correctness has not been evaluated in this research.

Probe result: native node `4:2` persisted across updates and plugin restart (revisions 1–6). The automated launch uses observed Quick Actions and `plugins-menu-item` controls. Full JSON importer integration, TSX watch/HMR and bidirectional source edits are still planned work.

Start with [live renderer usage](usage.md). The original probe remains available separately.

Public identity props are now optional: id/nativeID follow React Native precedence, and anonymous nodes receive positional internal IDs. Legacy renderId remains compatible. See usage.md for structural-edit limits.
