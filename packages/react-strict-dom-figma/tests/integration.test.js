const { test } = require('node:test');
const assert = require('node:assert/strict');
const React = require('react');
const renderer = require('react-test-renderer');
const { html, css } = require('../lib');
const { normalize } = require('../lib/normalize');
const { renderToJSON } = require('react-figmaapp');
const { Button, Gallery } = require('../../../examples/strict-dom-figma/lib/components');
const h = React.createElement;
function tree(element) {
  const instance = renderer.create(element);
  const json = instance.toJSON();
  instance.unmount();
  return json;
}
function walk(node) {
  return [node, ...(node.children || []).flatMap(walk)];
}

test('shared button renders directly through react-figmaapp without gap wrappers', () => {
  const node = tree(h(Button, null, 'Continue'));
  assert.equal(node.type, 'sketch_view');
  assert.equal(node.props.name, 'Shared button');
  assert.equal(node.props.style.flexDirection, 'row');
  assert.equal(node.props.style.paddingLeft, 32);
  assert.equal(node.props.style.paddingTop, 8);
  assert.equal(node.children.length, 2);
  assert.equal(node.children[1].type, 'sketch_text');
  assert.equal(node.children[1].props.style.marginLeft, 4);
  assert.equal(node.children[0].props.style.fontWeight, 'bold');
});

test('logical spacing, units, content-box dimensions and arrays normalize immutably', () => {
  const source = {
    width: '2rem',
    height: 10,
    padding: 2,
    borderWidth: 1,
    paddingBlockEnd: 4,
    marginInlineEnd: '3px',
    textDecorationLine: 'underline',
  };
  assert.deepEqual(normalize([false, source, [null, { paddingInline: 8 }]]), {
    width: 50,
    height: 18,
    padding: 2,
    borderWidth: 1,
    paddingLeft: 8,
    paddingRight: 8,
    paddingBottom: 4,
    marginRight: 3,
    textDecoration: 'underline',
  });
  assert.equal(source.width, '2rem');
  assert.equal(normalize({ fontFamily: 'System' }).fontFamily, 'System');
  assert.equal(normalize({ width: 20, padding: 4, boxSizing: 'border-box' }).width, 20);
  assert.deepEqual(css.create({ text: [{ color: 'red' }, false, { color: 'blue' }] }).text, {
    color: 'blue',
  });
});

test('typography inherits through views, nested text and raw numeric children', () => {
  const node = tree(
    h(
      html.div,
      { style: { color: 'red', fontSize: 20 } },
      'hello',
      42,
      h(html.p, null, h(html.strong, null, h(html.span, null, 'bold'))),
    ),
  );
  assert.equal(node.props.style.color, undefined);
  assert.equal(node.children[0].props.style.color, 'red');
  assert.deepEqual(node.children[1].children, ['42']);
  const nested = node.children[2].children[0].children[0];
  assert.equal(nested.props.style.fontWeight, 'bold');
  assert.equal(nested.props.style.fontSize, 20);
});

test('images honor style arrays, size overrides, objectFit, names and visibility', () => {
  const node = tree(
    h(html.img, {
      src: 'photo.png',
      alt: 'Portrait',
      width: 50,
      height: 60,
      style: [{ width: 80 }, false, { objectFit: 'contain' }],
    }),
  );
  assert.equal(node.props.name, 'Portrait');
  assert.deepEqual(node.props.source, { uri: 'photo.png' });
  assert.equal(node.props.style.width, 80);
  assert.equal(node.props.style.height, 60);
  assert.equal(node.props.resizeMode, 3);
  for (const tag of ['div', 'span', 'img', 'input']) {
    assert.equal(tree(h(html[tag], { style: { display: 'none' } })), null);
    assert.equal(tree(h(html[tag], { hidden: true })), null);
  }
});

test('static form controls preserve zero, defaults, placeholders and password masking', () => {
  assert.deepEqual(tree(h(html.input, { value: 0, placeholder: 'empty' })).children[0].children, [
    '0',
  ]);
  assert.deepEqual(tree(h(html.input, { defaultValue: 'Ada' })).children[0].children, ['Ada']);
  assert.deepEqual(tree(h(html.textarea, { placeholder: 'Notes' })).children[0].children, [
    'Notes',
  ]);
  assert.deepEqual(
    tree(h(html.input, { value: 'secret', type: 'password' })).children[0].children,
    ['••••••'],
  );
  assert.equal(tree(h(html.input, { type: 'hidden' })), null);
});

test('reverse gap preserves existing child margins and flex properties', () => {
  const node = tree(
    h(
      html.div,
      { style: { display: 'flex', flexDirection: 'row-reverse', columnGap: 5 } },
      h(html.div),
      h(html.div, { style: { marginRight: 2, flexGrow: 1 } }),
    ),
  );
  assert.equal(node.children[1].props.style.marginRight, 7);
  assert.equal(node.children[1].props.style.flexGrow, 1);
});

test('gallery exports real Figma frames and styled text with measured layout', () => {
  const file = renderToJSON(h(Gallery));
  const nodes = walk(file.document);
  const button = nodes.find((n) => n.name === 'Shared button');
  assert.ok(button);
  assert.ok(button.absoluteBoundingBox.width > 64);
  const text = nodes.find((n) => n.characters === 'Continue');
  assert.equal(text.type, 'TEXT');
  assert.equal(text.style.fontFamily, 'Arial');
  assert.equal(text.style.fontWeight, 700);
  const suffix = nodes.find((n) => n.characters === '(shared)');
  assert.equal(
    suffix.absoluteBoundingBox.x - (text.absoluteBoundingBox.x + text.absoluteBoundingBox.width),
    4,
  );
  assert.ok(nodes.some((n) => n.name === 'Embedded image'));
  assert.ok(nodes.some((n) => n.characters === 'Ada Lovelace'));
  assert.ok(nodes.some((n) => n.characters && n.characters.includes('bold')));
});

test('export preserves gallery, button and input backgrounds separately from text fills', () => {
  const file = renderToJSON(h(Gallery));
  const nodes = walk(file.document);
  const root = nodes.find((n) => n.name === 'main');
  const button = nodes.find((n) => n.name === 'Shared button');
  const input = nodes.find((n) => n.name === 'input');
  const textarea = nodes.find((n) => n.name === 'textarea');
  assert.deepEqual(root.fills[0].color, { r: 1, g: 1, b: 1, a: 1 });
  assert.deepEqual(button.fills[0].color, { r: 0, g: 100 / 255, b: 0, a: 1 });
  assert.equal(input.type, 'FRAME');
  assert.equal(input.fills[0].color.r, 247 / 255);
  assert.equal(input.strokes[0].color.r, 204 / 255);
  assert.equal(input.children[0].absoluteBoundingBox.x - input.absoluteBoundingBox.x, 9);
  assert.equal(input.children[0].fills[0].color.r, 0);
  assert.equal(textarea.fills[0].color.r, 247 / 255);
});

test('Arial Bold label bounds are wide enough for Continue on a single line', () => {
  const nodes = walk(renderToJSON(h(Button, null, 'Continue')).document);
  const label = nodes.find((n) => n.characters === 'Continue');
  // Independent Arial Bold 16 glyph advance: 69.3203125px. The old heuristic
  // exported 69px, causing Figma to wrap the last letters to a second line.
  assert.equal(label.absoluteBoundingBox.width, 70);
  assert.equal(label.absoluteBoundingBox.height, 20);
});

test('gallery custom components forward gap styles to their root nodes', () => {
  const nodes = walk(renderToJSON(h(Gallery)).document);
  const root = nodes.find((n) => n.name === 'main');
  const children = root.children;
  for (let i = 1; i < children.length; i++) {
    assert.equal(
      children[i].absoluteBoundingBox.y -
        (children[i - 1].absoluteBoundingBox.y + children[i - 1].absoluteBoundingBox.height),
      24,
    );
  }
});

const { ComponentGallery, frameNames } = require('../../../examples/strict-dom-figma/lib/showcase');

test('component gallery exports eight named, non-overlapping frames with bounded content', () => {
  const file = renderToJSON(h(ComponentGallery));
  const page = file.document.children[0];
  assert.equal(page.name, 'Strict DOM / Components');
  assert.deepEqual(
    page.children.map((n) => n.name),
    frameNames,
  );
  page.children.forEach((frame, i) => {
    assert.equal(frame.type, 'FRAME');
    const box = frame.absoluteBoundingBox;
    assert.deepEqual(box, {
      x: (i % 3) * 480,
      y: Math.floor(i / 3) * 700,
      width: 440,
      height: 660,
    });
    walk(frame).forEach((node) => {
      const child = node.absoluteBoundingBox;
      assert.ok(
        child.x >= box.x - 0.1 &&
          child.y >= box.y - 0.1 &&
          child.x + child.width <= box.x + box.width + 0.1 &&
          child.y + child.height <= box.y + box.height + 0.1,
        `${frame.name}: ${node.name} exceeds frame bounds`,
      );
    });
  });
});

test('component states retain input fills, radio dots, switch positions and status colors', () => {
  const file = renderToJSON(h(ComponentGallery));
  const frames = file.document.children[0].children;
  const inputs = walk(frames[1]);
  const control = inputs.find((n) => n.name === 'Display name control');
  assert.equal(control.strokeWeight, 2);
  assert.equal(control.strokes[0].color.b, 224 / 255);
  assert.ok(inputs.some((n) => n.characters === 'Account code verified.'));
  assert.equal(frames[2].fills[0].color.r, 22 / 255);
  const radios = walk(frames[4]);
  const selected = radios.find((n) => n.name === 'Radio selected');
  assert.equal(selected.children[0].fills[0].color.r, 1);
  assert.equal(selected.cornerRadius, 9);
  const switches = walk(frames[5]);
  const on = switches.find((n) => n.name === 'Switch / Notifications');
  const off = switches.find((n) => n.name === 'Switch / Nearby discovery');
  assert.equal(on.children[0].absoluteBoundingBox.x - on.absoluteBoundingBox.x, 22);
  assert.equal(off.children[0].absoluteBoundingBox.x - off.absoluteBoundingBox.x, 2);
  const feedback = walk(frames[7]);
  const bar = feedback.find((n) => n.name === 'Progress 65 percent');
  const track = feedback.find((n) => n.name === 'Progress track');
  assert.ok(Math.abs(bar.width / track.width - 0.65) < 0.001);
  assert.ok(feedback.some((n) => n.name === 'Error banner' && n.fills[0].color.r === 253 / 255));
});

test('overflow is preserved and rounded frames clip their child backgrounds', () => {
  for (const [overflow, expected] of [
    ['hidden', true],
    ['scroll', true],
    ['visible', false],
  ]) {
    const file = renderToJSON(
      h(
        html.div,
        {
          'aria-label': 'Clip container',
          style: { width: 100, height: 50, borderRadius: 14, overflow },
        },
        h(html.div, { style: { width: 150, height: 70, backgroundColor: 'red' } }),
      ),
    );
    const frame = walk(file.document).find((n) => n.name === 'Clip container');
    assert.equal(frame.clipsContent, expected);
    assert.equal(frame.cornerRadius, 14);
  }
  const menus = walk(renderToJSON(h(ComponentGallery)).document).filter(
    (n) => n.name === 'Rounded menu card',
  );
  assert.equal(menus.length, 2);
  for (const menu of menus) {
    assert.equal(menu.type, 'FRAME');
    assert.equal(menu.clipsContent, true);
    assert.equal(menu.cornerRadius, 14);
    assert.ok(menu.children.length > 1);
  }
});

test('html.img uri source exports a valid visible PNG without replacing its bytes', () => {
  const { IMAGE_SRC } = require('../../../examples/strict-dom-figma/lib/imageFixture');
  const file = renderToJSON(
    h(html.img, { src: IMAGE_SRC, width: 64, height: 64, style: { objectFit: 'contain' } }),
  );
  const image = walk(file.document).find((n) => n.type === 'RECTANGLE');
  const paint = image.fills[0];
  assert.equal(paint.type, 'IMAGE');
  assert.equal(paint.scaleMode, 'FIT');
  assert.equal(paint.imageData, IMAGE_SRC.split(',')[1]);
  const bytes = Buffer.from(paint.imageData, 'base64');
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  const crc32 = (buffer) => {
    let crc = 0xffffffff;
    for (const byte of buffer) {
      crc ^= byte;
      for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
    return (crc ^ 0xffffffff) >>> 0;
  };
  const data = [];
  for (let offset = 8; offset < bytes.length; ) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString();
    assert.equal(
      crc32(bytes.subarray(offset + 4, offset + 8 + length)),
      bytes.readUInt32BE(offset + 8 + length),
      `${type} checksum`,
    );
    if (type === 'IHDR') {
      assert.equal(bytes.readUInt32BE(offset + 8), 32);
      assert.equal(bytes.readUInt32BE(offset + 12), 32);
    }
    if (type === 'IDAT') data.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  const pixels = require('node:zlib').inflateSync(Buffer.concat(data));
  assert.equal(pixels.length, 32 * (1 + 32 * 4));
  assert.deepEqual([...pixels.subarray(1, 5)], [53, 89, 224, 255]);
  assert.deepEqual([...pixels.subarray(33, 37)], [80, 205, 160, 255]);
});

test('ImageExample imports image.ts and exports its PNG bytes without fallback', () => {
  const { ImageExample } = require('../../../examples/strict-dom-figma/lib/components');
  const imageData = require('../../../examples/strict-dom-figma/lib/image').default;
  const { Image } = require('react-figmaapp');
  const adapted = walk(renderToJSON(h(ImageExample)).document).find(n => n.name === 'Embedded image');
  const direct = walk(renderToJSON(h(Image, {
    source: `data:image/png;base64,${imageData}`, style: { width: 64, height: 64 }, resizeMode: 'contain',
  })).document).find(n => n.type === 'RECTANGLE');
  assert.equal(adapted.fills[0].imageData, imageData);
  assert.deepEqual(adapted.fills, direct.fills);
  const bytes = Buffer.from(imageData, 'base64');
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.readUInt32BE(16), 200);
  assert.equal(bytes.readUInt32BE(20), 200);
});
