import * as React from 'react';
import {
  Artboard,
  Text,
  View,
  Image,
  Svg,
  renderToJSON,
  renderToLiveJSON,
} from '../../../src/figma';
const options = { projectId: 'test', rootId: 'root' };
it('assigns deterministic anonymous IDs only to live snapshots', () => {
  const element = (
    <Artboard style={{ width: 100, height: 100 }}>
      <Text>Hello</Text>
    </Artboard>
  );
  const headless = renderToJSON(element).document.children[0].children[0];
  expect(headless.renderId).toBeUndefined();
  const first = renderToLiveJSON(element, options).file.document.children[0].children[0];
  const second = renderToLiveJSON(element, options).file.document.children[0].children[0];
  expect(first.renderId).toBe(second.renderId);
  if (first.type !== 'FRAME' || second.type !== 'FRAME') throw Error('Expected frame');
  expect(first.children[0].renderId).toBe(second.children[0].renderId);
  expect(first.children[0].renderId).not.toBe(first.renderId);
  const updated = renderToLiveJSON(
    <Artboard style={{ width: 120, height: 100 }}>
      <Text>Changed content</Text>
    </Artboard>,
    options,
  ).file.document.children[0].children[0];
  if (updated.type !== 'FRAME') throw Error('Expected frame');
  expect(updated.renderId).toBe(first.renderId);
  expect(updated.children[0].renderId).toBe(first.children[0].renderId);
});
it('uses id before nativeID and legacy renderId, while retaining source provenance', () => {
  const element = (
    <Artboard
      id="card"
      nativeID="ignored"
      renderId="legacy"
      sourceId="declaration"
      style={{ width: 100, height: 100 }}
    >
      <Text nativeID="title">Hello</Text>
    </Artboard>
  );
  const card = renderToLiveJSON(element, options).file.document.children[0].children[0];
  expect(card.renderId).toBe('card');
  expect(card.sourceId).toBe('declaration');
  if (card.type !== 'FRAME') throw Error('Expected frame');
  expect(card.children[0].renderId).toBe('title');
  expect(() =>
    renderToLiveJSON(
      <Artboard id="same">
        <View nativeID="same" />
      </Artboard>,
      options,
    ),
  ).toThrow('Duplicate native ID');
  expect(
    renderToLiveJSON(<View renderId="legacy" />, options).file.document.children[0].children[0]
      .renderId,
  ).toBe('legacy');
});
it('anchors anonymous descendants under an explicitly identified parent across sibling insertion', () => {
  const card = (
    <View id="card">
      <Text>Anonymous title</Text>
    </View>
  );
  const before = renderToLiveJSON(<Artboard>{card}</Artboard>, options);
  const after = renderToLiveJSON(
    <Artboard>
      <View id="new" />
      {card}
    </Artboard>,
    options,
  );
  const findCard = (file: typeof before) => {
    const root = file.file.document.children[0].children[0];
    if (root.type !== 'FRAME') throw Error('Expected frame');
    const node = root.children.find((n) => n.renderId === 'card');
    if (!node || node.type !== 'FRAME') throw Error('Expected card');
    return node;
  };
  expect(findCard(before).children[0].renderId).toBe(findCard(after).children[0].renderId);
});
it('forwards id on image and SVG nodes and avoids collisions with explicit automatic-looking IDs', () => {
  const result = renderToLiveJSON(
    <Artboard>
      <View id="@auto/%24root/0" />
      <Image id="image" style={{ width: 1, height: 1 }} />
      <Svg id="icon" width={10} height={10}>
        <Svg.Circle cx={5} cy={5} r={2} />
      </Svg>
    </Artboard>,
    options,
  );
  const root = result.file.document.children[0].children[0];
  expect(root.renderId).not.toBe('@auto/%24root/0');
  if (root.type !== 'FRAME') throw Error('Expected frame');
  expect(root.children.map((n) => n.renderId)).toEqual(['@auto/%24root/0', 'image', 'icon']);
});

it('preserves sibling Artboards returned by a Fragment in headless and live exports', () => {
  const element = (
    <>
      <Artboard id="first" name="First" style={{ width: 120, height: 80 }}>
        <Text>First content</Text>
      </Artboard>
      <Artboard id="second" name="Second" style={{ width: 240, height: 160 }}>
        <Text>Moved content</Text>
      </Artboard>
    </>
  );
  const headless = renderToJSON(element).document.children[0].children;
  expect(headless.map((node) => node.name)).toEqual(['First', 'Second']);
  const live = renderToLiveJSON(element, options).file.document.children[0].children;
  expect(live.map((node) => node.renderId)).toEqual(['first', 'second']);
  expect(live.map((node) => node.type)).toEqual(['FRAME', 'FRAME']);
  expect(live[1].width).toBe(240);
  expect(live[1].height).toBe(160);
  expect(live[1].y).toBeGreaterThanOrEqual(live[0].y + live[0].height);
  if (live[1].type !== 'FRAME') throw Error('Expected second frame');
  expect(live[1].children[0]).toMatchObject({ type: 'TEXT', characters: 'Moved content' });
});
