import { connectUI } from './launch.mjs';
import { chromium } from 'playwright';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const token = process.env.FIGMA_BRIDGE_TOKEN;
if (!token) throw Error('Set FIGMA_BRIDGE_TOKEN');
const fixture = new URL('../../../examples/strict-dom-figma/live.tsx', import.meta.url);
const original = await readFile(fixture, 'utf8');
const b = await chromium.connectOverCDP(process.env.FIGMA_CDP_URL || 'http://127.0.0.1:9222');
const p = b
  .contexts()
  .flatMap((c) => c.pages())
  .find((p) =>
    process.env.FIGMA_DRAFT_URL
      ? p.url().split('?')[0] === process.env.FIGMA_DRAFT_URL.split('?')[0]
      : p.url().includes('/design/'),
  );
if (!p) throw Error('Open the disposable test Draft');
const status = async () => {
  const r = await fetch('http://localhost:3848/status?token=' + encodeURIComponent(token));
  if (!r.ok) throw Error('Bridge ' + r.status);
  return r.json();
};
async function applied(after = -1) {
  const end = Date.now() + 30000;
  while (Date.now() < end) {
    const s = await status();
    if (s.diagnostic) throw Error(s.diagnostic);
    if (s.status?.type === 'error') throw Error(s.status.message);
    if (s.status?.type === 'applied' && s.status.revision > after) return s.status;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw Error('Timed out waiting for live renderer');
}
async function launch() {
  if (await p.getByTestId('pluginModalWindow').isVisible()) {
    await p.getByTestId('pluginModalWindow').getByLabel('Close', { exact: true }).click();
    await p.getByTestId('pluginModalWindow').waitFor({ state: 'hidden' });
  }
  await p.keyboard.press('Meta+k');
  await p.getByTestId('quick-actions-search-input').fill('react-designapp live probe');
  await p
    .getByTestId('plugins-menu-item')
    .filter({ hasText: 'react-designapp live probe' })
    .click();
  await connectUI(p, token);
}
try {
  await launch();
  const initial = await applied();
  assert.equal(initial.readback.find((n) => n.renderId === 'card').width, 360);
  assert.equal(
    initial.readback.find((n) => n.renderId === 'title').characters,
    'Live Figma renderer',
  );
  assert.ok(initial.mappings.icon);
  assert.ok(initial.mappings.image);
  assert.ok(initial.readback.find((n) => n.renderId === 'image').imageHash);
  assert.ok(
    initial.readback
      .find((n) => n.renderId === 'body')
      .textRuns.some((run) => run.characters === 'React' && run.fontName.style === 'Bold'),
  );
  await writeFile(fixture, original.replace('const version = 1;', 'const version = 2;'));
  const updated = await applied(initial.revision);
  assert.equal(updated.readback.find((n) => n.renderId === 'card').width, 420);
  assert.equal(
    updated.readback.find((n) => n.renderId === 'title').characters,
    'Hot update applied',
  );
  for (const id of ['card', 'title', 'panel', 'body', 'icon', 'image'])
    assert.equal(updated.mappings[id], initial.mappings[id]);
  assert.ok(updated.mappings.inserted);
  assert.ok(!updated.mappings.obsolete);
  assert.ok(updated.deleted.includes('obsolete'));
  // Clear acknowledgement locally by awaiting a new source revision before restart.
  await launch();
  const end = Date.now() + 20000;
  let restarted;
  while (Date.now() < end) {
    const s = await status();
    if (s.status?.type === 'error') throw Error(s.status.message);
    if (s.status?.revision === updated.revision && s.status.created.length === 0) {
      restarted = s.status;
      break;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  assert.ok(restarted, 'Restart should hydrate without creating nodes');
  assert.deepEqual(restarted.mappings, updated.mappings);
  await mkdir('artifacts', { recursive: true });
  await writeFile(
    'artifacts/live-results.json',
    JSON.stringify({ initial, updated, restarted }, null, 2),
  );
  await p.screenshot({ path: 'artifacts/live-renderer.png' });
  console.log(
    JSON.stringify(
      {
        passed: true,
        initialRevision: initial.revision,
        updatedRevision: updated.revision,
        mappings: updated.mappings,
        deleted: updated.deleted,
        restartCreated: restarted.created,
        diagnostics: updated.diagnostics,
      },
      null,
      2,
    ),
  );
} finally {
  await writeFile(fixture, original);
  await b.close();
}
