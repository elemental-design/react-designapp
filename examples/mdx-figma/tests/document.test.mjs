import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { generateDocument } from '../generate.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const flatten = node => [node, ...(node.children ?? []).flatMap(flatten)];

test('renders an MDX document as editable Figma nodes, without slide splitting', async () => {
  const dir = await mkdtemp(join(here, '.fixture-'));
  try {
    const file = await generateDocument(undefined, join(dir, 'document.json'));
    assert.equal(file.document.children.length, 1);
    const page = file.document.children[0];
    assert.equal(page.children.length, 1);
    const document = page.children[0];
    assert.equal(document.name, 'MDX on the design canvas');
    assert.equal(document.absoluteBoundingBox.width, 960);
    assert.ok(document.absoluteBoundingBox.height > 700);
    const nodes = flatten(document);
    assert.ok(nodes.some(node => node.name === 'hr' && node.absoluteBoundingBox.height === 1));
    const text = nodes.filter(node => node.type === 'TEXT');
    assert.ok(text.some(node => node.characters.includes('MDX on the design canvas')));
    assert.ok(text.some(node => node.characters.includes('MDX compiles to React.')));
    assert.ok(text.some(node => node.characters.includes('Horizontal rules separate sections')));
    assert.ok(text.some(node => node.characters.includes('inline emphasis') && Object.keys(node.styleOverrideTable).length > 0));
    assert.ok(text.some(node => node.characters === '1.'));
    assert.ok(text.some(node => node.characters === '3.'));
    for (const node of text) {
      assert.ok(node.absoluteBoundingBox.width > 0 && node.absoluteBoundingBox.height > 0);
      assert.ok(node.style.lineHeightPx >= node.style.fontSize);
      assert.equal(node.style.fontFamily === 'Arial' || node.style.fontFamily === 'Menlo', true);
    }
  } finally { await rm(dir, { recursive: true, force: true }); }
});

test('plain Markdown rules remain document content and invalid MDX fails', async () => {
  const dir = await mkdtemp(join(here, '.fixture-'));
  try {
    const input = join(dir, 'document.md');
    await writeFile(input, '# First\n\n---\n\n# Second');
    const file = await generateDocument(input, join(dir, 'document.json'));
    assert.equal(file.document.children[0].children.length, 1);
    const nodes = flatten(file.document.children[0]);
    assert.ok(nodes.some(node => node.type === 'TEXT' && node.characters === 'First'));
    assert.ok(nodes.some(node => node.type === 'TEXT' && node.characters === 'Second'));
    await writeFile(input, '---\ntitle: [broken\n---\n# Invalid');
    await assert.rejects(generateDocument(input, join(dir, 'document.json')));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
