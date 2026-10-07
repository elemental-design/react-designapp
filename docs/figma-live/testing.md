# End-to-end environment

## Setup

The isolated probe lives in `tools/figma-live`; it does not alter workspace dependencies. Node 22+ is available on the preparation host. Run commands from that directory:

```sh
npm install
export FIGMA_PLUGIN_ID=<ID-from-Figma-Create-new-plugin>
npm run prepare
export FIGMA_BRIDGE_TOKEN=<choose-a-local-session-token>
npm run serve
```

Create a plugin using Figma Desktop to obtain its stable ID, then import the generated `plugin/manifest.json`. Open a disposable Draft. The probe creates/updates a blue frame tagged `figma-live-probe/root` on the current page. Keep that page selected; this minimal probe does not support cross-page sync. It deliberately leaves the frame behind for restart/hydration testing.

## Electron/CDP investigation

First try a fresh launch of the installed executable (path may differ):

```sh
/Applications/Figma.app/Contents/MacOS/Figma --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1
curl http://127.0.0.1:9222/json/version
```

An already running instance can absorb startup arguments without enabling debugging. Close it normally before retrying; do not kill active user work. Electron documents remote-debugging-port, but this is not evidence that the packaged Figma build exposes it. Inspect the response before assuming CDP is available. Do not change Figma fuses or bypass app security. Playwright's `_electron.launch` is an alternative experimental investigation, not a verified Figma launch recipe; its main-process debugger requirements differ from renderer-only CDP attachment.

With an accessible CDP endpoint, set `FIGMA_CDP_URL` (default http://127.0.0.1:9222), `FIGMA_DRAFT_URL` to the open test file URL, and run:

```sh
npm run discover
npm run smoke
```

Discovery records observed DOM test IDs/roles/labels and screenshots in ignored `artifacts/`. Open Figma's plugin menu/quick actions before discovery to capture the relevant controls. No internal Figma test IDs have been verified on this host. Prefer observed accessible roles/names, then observed test IDs; avoid coordinate clicks and undocumented application JS calls.

The smoke command connects to the already running plugin UI, enters the bridge token, applies two revisions, and verifies name/width and unchanged native ID. Optionally set `FIGMA_PLUGIN_LAUNCH_SELECTOR` to an observed selector for a currently visible launch control. That single click is a hook, not complete navigation/import automation. Extend a separate launch adapter from actual captured UI states to open menus and choose the development plugin; after launch, readiness is established by finding plugin UI and receiving acknowledgement.

Native menu bars/file dialogs may be outside renderer CDP and need macOS accessibility automation for initial registration. Browser Playwright is a fallback for an available distributed plugin, not for importing a local Desktop development manifest. A full launch test must prove plugin-closed → ready; manual launch only proves the transport test.

Restart test: record smoke output; close and rerun plugin, then rerun smoke and compare native node ID. Add font/image/importer readback tests in subsequent phases. A fresh local transport test is `npm test`; it does not claim Figma end-to-end success.

## Research sources

- [Figma development setup](https://developers.figma.com/docs/plugins/plugin-quickstart-guide/): Desktop is required for development/testing.
- [Development plugin registration](https://help.figma.com/hc/en-us/articles/360042786733-Create-a-plugin-for-development).
- [Plugin manifest](https://developers.figma.com/docs/plugins/manifest/): assigned plugin ID and development localhost allowlist.
- [Playwright Electron](https://playwright.dev/docs/api/class-electron): experimental support.
- [Playwright CDP](https://playwright.dev/docs/api/class-browsertype#browser-type-connect-over-cdp): Chromium-only, lower fidelity than Playwright protocol.
- [Electron CLI switches](https://www.electronjs.org/docs/latest/api/command-line-switches): remote debugging port.
- [Electron fuses](https://www.electronjs.org/docs/latest/tutorial/fuses): packaged apps can disable Node inspector arguments.
- [Plugin data](https://developers.figma.com/docs/plugins/api/properties/nodes-setplugindata/): persistence namespace and size limits.
- [Document changes](https://developers.figma.com/docs/plugins/api/DocumentChange/).

## Local investigation update (2026-10-06)

Installed app: `/Applications/Figma.app`, version 126.9.11. An existing main process was running without remote-debugging arguments. Launch Services returned success for the documented launch command, but port 9222 refused connections afterward. This does not establish whether a fresh Figma process accepts CDP flags. Native Computer Use was unavailable because permissions were not granted. Next step: quit Figma normally, then launch its executable with the flags above and probe `/json/version` before selector discovery.

## Fresh-launch finding

A direct launch of Figma 126.9.11 with `--remote-debugging-port=9222 --remote-debugging-address=127.0.0.1` succeeded, but both curl and Playwright received connection refused. Read-only inspection of the installed `Contents/Resources/app.asar` found this startup guard:

```js
process.env.FIGMA_TEST || app.commandLine.removeSwitch("remote-debugging-port")
```

This identifies a built-in test-mode candidate, not a verified attachment recipe. The same environment flag also bypasses some unsaved-work/close confirmations and disables the normal updater. Test only after explicit user agreement, with no valuable open work. Do not patch the archive. Proposed next experiment, after normal app quit:

```sh
FIGMA_TEST=1 /Applications/Figma.app/Contents/MacOS/Figma --remote-debugging-port=9222 --remote-debugging-address=127.0.0.1
```

Then probe `/json/version` and enumerate Playwright pages. Test mode may initially load about:blank windows; record actual renderer targets before navigation. This flag is internal and version-dependent.

## Verified CDP and creation UI

After user approval, `FIGMA_TEST=1` plus the loopback debugging flags exposed DevTools and Playwright connected successfully on Figma 126.9.11 (Electron 43.7.7). An authenticated empty Untitled design document was restored. The following UI controls were observed and exercised:

- `Meta+k` opens Quick Actions.
- `getByTestId('quick-actions-search-input')` is the search input.
- Search `plugin`, then exact text `New plugin…` opens creation.
- `getByPlaceholder('Plugin name')` names the plugin.
- `input[value="figma"]` is the Design product radio; use `.check()` rather than clicking overlay text.
- Exact text `Next` advances; role-based button matching did not resolve this control.
- `input[value="withUI"]` is the Custom UI radio. Its input overlays the text, so `.check()` is necessary.
- Exact text `Save as` opens the native save step after selecting the template.

Native save is a remaining first-time setup handoff because Computer Use permission is absent. Save under `tools/figma-live/generated-plugin`, then use its manifest ID:

```sh
FIGMA_GENERATED_MANIFEST=./generated-plugin/manifest.json npm run prepare
```

The generated template folder is ignored. Import the prepared probe manifest after creation (the generated template itself is not the probe). Next investigation is the observed `Import plugin from manifest…` quick action, including whether that opens a native chooser, followed by plugin-name search/run and smoke acknowledgement. No automatic plugin run is claimed until that sequence succeeds.

## Passing real-app smoke and restart

The user saved the template at `tools/figma-live/generated-plugin`. Preparing the probe with that assigned ID and copying its manifest, code.js and ui.html into the already registered template directory avoided a second import dialog. This is an intentional replacement of the disposable generated template.

```sh
FIGMA_GENERATED_MANIFEST=./generated-plugin/manifest.json npm run prepare
cp plugin/code.js plugin/ui.html plugin/manifest.json generated-plugin/
npm run serve
# In another terminal, use the token printed by the bridge:
export FIGMA_BRIDGE_TOKEN=<printed-token>
npm run smoke
npm run restart
```

Verified on 2026-10-06: smoke applied revisions 1/2, changing width 240 → 320 and name while preserving `4:2`. Automatic relaunch applied revisions 3/4 with the same ID. Restart closed the plugin, launched it through Quick Actions and applied revisions 5/6 with the same native ID. Node metadata was therefore sufficient to hydrate this single-frame probe.

Observed launch selector: `getByTestId('plugins-menu-item').filter({hasText:'react-designapp live probe'})`, after Quick Actions search. Observed close selector: `getByTestId('pluginModalWindow').getByLabel('Close', {exact:true})`. Figma leaves a hidden plugin modal in the DOM after closing; check visibility, not element count. The harness now handles this and searches nested frames for visible probe UI.

`npm run smoke` automatically launches the registered plugin if its modal is hidden. `npm run restart` requires an initial successful smoke acknowledgement, closes/relaunches and asserts that the previous native ID is retained. Neither command creates/registers a new plugin. A token and running bridge are required. The current page must remain the same. No full JSON renderer, file watcher or bidirectional editing is exercised yet.

Ignored local evidence: `tools/figma-live/artifacts/figma.png`, `selectors.json`, and `results.json`. No Draft URL, bridge token or account identifiers are committed. Figma remains running in the approved test mode and the bridge remains available for follow-up testing; quit/relaunch normally when finished to restore ordinary confirmation behavior.
