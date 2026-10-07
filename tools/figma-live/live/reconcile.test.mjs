import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcile, META } from './reconcile.mjs';
function environment() {
  let counter = 0;
  class Node {
    constructor(type) {
      this.id = String(++counter);
      this.type = type;
      this.data = {};
      this.children = [];
      this.removed = false;
    }
    setPluginData(k, v) {
      this.data[k] = v;
    }
    getPluginData(k) {
      return this.data[k] || '';
    }
    resize(w, h) {
      this.width = w;
      this.height = h;
    }
    appendChild(n) {
      this.insertChild(this.children.length, n);
    }
    insertChild(i, n) {
      if (n.removed) throw Error('Removed node');
      if (n.parent) n.parent.children.splice(n.parent.children.indexOf(n), 1);
      this.children.splice(Math.min(i, this.children.length), 0, n);
      n.parent = this;
    }
    findAll(predicate) {
      return this.children.flatMap((n) => [...(predicate(n) ? [n] : []), ...n.findAll(predicate)]);
    }
    remove() {
      for (const n of [...this.children]) n.remove();
      if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1);
      this.removed = true;
    }
  }
  const root = new Node('DOCUMENT'),
    page = new Node('PAGE');
  root.appendChild(page);
  const create = (type) => {
    const n = new Node(type);
    page.appendChild(n);
    return n;
  };
  return {
    root,
    currentPage: page,
    loadAllPagesAsync: async () => {},
    listAvailableFontsAsync: async () => [],
    createFrame: () => create('FRAME'),
    createRectangle: () => create('RECTANGLE'),
    createNodeFromSvg: () => create('FRAME'),
    commitUndo: () => {},
  };
}
const rect = (id) => ({
  renderId: id,
  type: 'RECTANGLE',
  name: id,
  width: 20,
  height: 30,
  x: 0,
  y: 0,
  fills: [],
  strokes: [],
  effects: [],
});
const frame = (id, children) => ({ ...rect(id), type: 'FRAME', layoutMode: 'NONE', children });
const snapshot = (children) => ({
  schemaVersion: 1,
  projectId: 'test',
  rootId: 'root',
  file: { document: { children: [{ children }] } },
  revision: 1,
  sessionId: 'test',
});
test('reorder/reparent retains IDs; removed properties reset; restart hydrates', async () => {
  const figma = environment();
  const a = await reconcile(figma, snapshot([frame('a', [rect('x')]), frame('b', [rect('y')])]));
  const desired = snapshot([frame('b', [rect('x'), rect('y')]), frame('a', [])]);
  const b = await reconcile(figma, desired);
  assert.deepEqual(b.mappings, a.mappings);
  assert.equal(b.created.length, 0);
  const x = figma.root.findAll((n) => n.id === a.mappings.x)[0];
  assert.equal(x.parent.id, a.mappings.b);
  assert.equal(x.cornerRadius, 0);
  const c = await reconcile(figma, desired);
  assert.deepEqual(c.mappings, a.mappings);
  assert.equal(c.created.length, 0);
});
test('replacement/deletion preserve foreign descendants and unrelated page content', async () => {
  const figma = environment();
  const a = await reconcile(figma, snapshot([frame('a', [rect('child')]), rect('gone')]));
  const managed = figma.root.findAll((n) => n.id === a.mappings.a)[0];
  const foreign = figma.createRectangle();
  managed.appendChild(foreign);
  const unrelated = figma.createRectangle();
  const b = await reconcile(figma, snapshot([rect('a')]));
  assert.notEqual(b.mappings.a, a.mappings.a);
  assert.deepEqual(b.replaced, ['a']);
  assert.ok(b.deleted.includes('gone'));
  assert.equal(foreign.removed, false);
  assert.equal(unrelated.removed, false);
});
test('duplicate desired/native identity fails before changing existing canvas', async () => {
  const figma = environment();
  await assert.rejects(reconcile(figma, snapshot([rect('a'), rect('a')])), /duplicate/);
  assert.equal(figma.currentPage.children.length, 0);
  const a = await reconcile(figma, snapshot([rect('a')]));
  const native = figma.root.findAll((n) => n.id === a.mappings.a)[0];
  const duplicate = figma.createRectangle();
  duplicate.setPluginData(META, native.getPluginData(META));
  native.parent.appendChild(duplicate);
  await assert.rejects(reconcile(figma, snapshot([rect('a')])), /Duplicate native/);
  assert.equal(native.removed, false);
});
test('SVG replacement retains semantic ID mapping while reporting new native ID', async () => {
  const figma = environment();
  const svg = { ...rect('icon'), type: 'VECTOR', svg: '<svg/>' };
  const a = await reconcile(figma, snapshot([svg]));
  const b = await reconcile(figma, snapshot([{ ...svg, svg: '<svg><rect/></svg>' }]));
  assert.notEqual(a.mappings.icon, b.mappings.icon);
  assert.deepEqual(b.replaced, ['icon']);
});
