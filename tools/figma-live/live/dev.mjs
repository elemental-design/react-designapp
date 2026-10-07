import { context, build } from 'esbuild';
import { WebSocketServer } from 'ws';
import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const here = dirname(fileURLToPath(import.meta.url));
const entry = resolve(process.argv[2] || '../../examples/strict-dom-figma/live.tsx');
const hotOnly = process.env.FIGMA_HOT_ONLY === '1';
if (!hotOnly) {
  const target = resolve(process.env.FIGMA_PLUGIN_DIR || 'generated-plugin');
  const manifest = JSON.parse(await readFile(join(target, 'manifest.json'), 'utf8'));
  manifest.main = 'code.js';
  manifest.ui = 'ui.html';
  manifest.editorType = ['figma'];
  manifest.networkAccess = {
    allowedDomains: ['none'],
    devAllowedDomains: ['http://localhost:3848', 'ws://localhost:3848'],
  };
  await build({
    entryPoints: [join(here, 'plugin.mjs')],
    bundle: true,
    format: 'iife',
    target: 'es2017',
    outfile: join(target, 'code.js'),
  });
  await writeFile(join(target, 'ui.html'), await readFile(join(here, 'ui.html')));
  await writeFile(join(target, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
}
const token = process.env.FIGMA_BRIDGE_TOKEN || randomUUID();
const sessionId = randomUUID();
let revision = 0,
  latest = null,
  status = null,
  diagnostic = null;
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.searchParams.get('token') !== token) {
    res.writeHead(401);
    res.end();
    return;
  }
  if (url.pathname !== '/status') {
    res.writeHead(404);
    res.end();
    return;
  }
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ sessionId, revision, status, diagnostic }));
});
const ws = new WebSocketServer({ noServer: true, maxPayload: 4 * 1024 * 1024 });
server.on('upgrade', (req, socket, head) => {
  if (new URL(req.url, 'http://localhost').searchParams.get('token') !== token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  ws.handleUpgrade(req, socket, head, (s) => ws.emit('connection', s, req));
});
const broadcast = (message) => {
  for (const client of ws.clients)
    if (client.readyState === 1) client.send(JSON.stringify(message));
};
ws.on('connection', (client) => {
  if (latest) client.send(JSON.stringify(latest));
  if (diagnostic) client.send(JSON.stringify({ type: 'build-error', message: diagnostic }));
  client.on('message', (bytes) => {
    try {
      const message = JSON.parse(bytes.toString());
      if (
        message.sessionId !== sessionId ||
        message.revision !== revision ||
        !['applied', 'error'].includes(message.type)
      )
        return;
      status = message;
      console.log(JSON.stringify(message));
    } catch {
      client.close(1003, 'Invalid acknowledgement');
    }
  });
});
try {
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(3848, '127.0.0.1', resolve);
  });
} catch (error) {
  if (error.code !== 'EADDRINUSE') throw error;
  console.error(
    'Figma live bridge port 3848 is already in use. Stop the other dev bridge with Ctrl+C, then rerun this command.',
  );
  process.exit(1);
}
await mkdir(new URL('../artifacts/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../artifacts/bridge-session.json', import.meta.url),
  JSON.stringify({ token }),
  { mode: 0o600 },
);
console.log(`Live bridge ws://localhost:3848 — token ${token}`);
const outDir = join(dirname(entry), '.figma-live');
await mkdir(outDir, { recursive: true });
const outfile = join(outDir, 'entry.cjs');
let chain = Promise.resolve();
async function render() {
  try {
    const snapshot = await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        [
          '-e',
          `const m=require(process.argv[1]); Promise.resolve(typeof m.default==='function'?m.default():m.default).then(s=>process.stdout.write('\\n__LIVE__'+JSON.stringify(s))).catch(e=>{console.error(e);process.exitCode=1;});`,
          outfile,
        ],
        { stdio: ['ignore', 'pipe', 'pipe'] },
      );
      let stdout = '',
        stderr = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stderr += d));
      child.on('error', reject);
      child.on('exit', (code) => {
        if (code !== 0) return reject(Error(stderr || stdout));
        try {
          resolve(JSON.parse(stdout.split('__LIVE__').pop()));
        } catch {
          reject(
            Error(
              'Entry must default-export a renderToLiveJSON snapshot or function returning one',
            ),
          );
        }
      });
    });
    if (snapshot.schemaVersion !== 1 || !snapshot.projectId || !snapshot.rootId)
      throw Error('Entry must export renderToLiveJSON output');
    latest = { ...snapshot, type: 'snapshot', sessionId, revision: ++revision };
    diagnostic = null;
    status = null;
    broadcast(latest);
    console.log(`Rendered revision ${revision}`);
  } catch (error) {
    diagnostic = String(error);
    broadcast({ type: 'build-error', message: diagnostic });
    console.error(diagnostic);
  }
}
const ctx = await context({
  entryPoints: [entry],
  bundle: true,
  packages: 'external',
  platform: 'node',
  format: 'cjs',
  outfile,
  plugins: [
    {
      name: 'live-render',
      setup(build) {
        build.onEnd((result) => {
          if (result.errors.length) {
            diagnostic = result.errors.map((e) => e.text).join('\n');
            broadcast({ type: 'build-error', message: diagnostic });
            return;
          }
          chain = chain.then(render);
        });
      },
    },
  ],
});
await ctx.watch();
if (!hotOnly && process.env.FIGMA_AUTO_LAUNCH === '1') {
  try {
    const { connectPlugin } = await import('./launch.mjs');
    const { browser } = await connectPlugin(token, { restart: true });
    await browser.close();
  } catch (error) {
    console.error(
      `Automatic plugin launch failed: ${error}. The bridge remains available for manual connection.`,
    );
  }
}
for (const signal of ['SIGINT', 'SIGTERM'])
  process.on(signal, async () => {
    await ctx.dispose();
    for (const client of ws.clients) client.close();
    ws.close();
    server.close();
    process.exit(0);
  });
