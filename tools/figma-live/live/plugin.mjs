import { reconcile } from './reconcile.mjs';
figma.showUI(__html__, { width: 380, height: 240 });
let pending = null,
  running = false,
  lastSession = null,
  lastRevision = -1,
  inflight = null,
  lastResult = null;
figma.ui.onmessage = (message) => {
  if (message.type === 'focus' && lastResult) {
    focus(lastResult);
    return;
  }
  if (message.type !== 'snapshot') return;
  if (
    (pending && pending.sessionId === message.sessionId && pending.revision >= message.revision) ||
    (inflight && inflight.sessionId === message.sessionId && inflight.revision >= message.revision)
  )
    return;
  if (message.sessionId === lastSession && message.revision <= lastRevision) return;
  pending = message;
  if (!running) drain();
};
async function drain() {
  running = true;
  while (pending) {
    const snapshot = pending;
    pending = null;
    inflight = snapshot;
    try {
      const result = await reconcile(figma, snapshot);
      lastSession = snapshot.sessionId;
      lastRevision = snapshot.revision;
      lastResult = result;
      figma.ui.postMessage(result);
    } catch (error) {
      figma.ui.postMessage({
        type: 'error',
        revision: snapshot.revision,
        sessionId: snapshot.sessionId,
        message: String(error),
      });
    }
    inflight = null;
  }
  running = false;
}

async function focus(result) {
  const top = result.readback.filter((node) => node.parentId === result.rootNodeId);
  const nodes = (await Promise.all(top.map((node) => figma.getNodeByIdAsync(node.id)))).filter(
    Boolean,
  );
  if (nodes.length) figma.viewport.scrollAndZoomIntoView(nodes);
}
