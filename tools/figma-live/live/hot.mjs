import { readFile } from 'node:fs/promises';

// Reuse the open plugin's token; never touch registration or its running UI.
if (!process.env.FIGMA_BRIDGE_TOKEN) {
  try {
    const saved = JSON.parse(
      await readFile(new URL('../artifacts/bridge-session.json', import.meta.url), 'utf8'),
    );
    process.env.FIGMA_BRIDGE_TOKEN = saved.token;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
if (!process.env.FIGMA_BRIDGE_TOKEN) {
  console.error(
    'Set FIGMA_BRIDGE_TOKEN to the token already entered in the running plugin. Future dev runs save it locally for hot reload.',
  );
  process.exit(1);
}
process.env.FIGMA_HOT_ONLY = '1';
await import('./dev.mjs');
