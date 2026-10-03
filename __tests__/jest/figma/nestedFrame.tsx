import * as React from 'react';
import { Document } from '../../../src/components/Document';
import { Page } from '../../../src/components/Page';
import { Artboard } from '../../../src/components/Artboard';
import { View } from '../../../src/components/View';
import { renderToFigmaJSON } from '../../../src/renderToFigmaJSON';

describe('Figma backend: nested auto-layout frame', () => {
  it('maps padding/gap/justify/align onto Figma auto-layout fields', () => {
    const json = renderToFigmaJSON()(
      <Document>
        <Page name="Page 1">
          <Artboard
            name="Tooltip"
            style={{
              flexDirection: 'column',
              paddingLeft: 32,
              paddingRight: 32,
              paddingTop: 32,
              paddingBottom: 64,
              // @ts-ignore gap is a Figma-only extension, ignored by Yoga/Sketch
              gap: 64,
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          >
            <View name="Frame 8" style={{ width: 100, height: 40 }} />
            <View name="Frame 9" style={{ width: 100, height: 40 }} />
          </Artboard>
        </Page>
      </Document>,
      { lastModified: '2024-06-14T13:14:19Z', name: 'New File 1', autoLayout: true },
    );

    const tooltip = json.document.children[0].children[0];
    expect(tooltip.type).toBe('FRAME');
    expect(tooltip.name).toBe('Tooltip');
    expect(tooltip.layoutMode).toBe('VERTICAL');
    expect(tooltip.paddingLeft).toBe(32);
    expect(tooltip.paddingRight).toBe(32);
    expect(tooltip.paddingTop).toBe(32);
    expect(tooltip.paddingBottom).toBe(64);
    expect(tooltip.itemSpacing).toBe(64);
    expect(tooltip.primaryAxisAlignItems).toBe('MIN');
    expect(tooltip.counterAxisAlignItems).toBe('CENTER');
    expect(tooltip.children).toHaveLength(2);
    expect(tooltip.children[0].type).toBe('RECTANGLE');
    expect(tooltip.children[0].name).toBe('Frame 8');

    expect(json).toMatchSnapshot();
  });
});
