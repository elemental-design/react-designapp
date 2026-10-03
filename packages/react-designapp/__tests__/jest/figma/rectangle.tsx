import * as React from 'react';
import { Document } from '../../../src/components/Document';
import { Page } from '../../../src/components/Page';
import { View } from '../../../src/components/View';
import { renderToFigmaJSON } from '../../../src/renderToFigmaJSON';

describe('Figma backend: rectangle', () => {
  it('generates a leaf View as a RECTANGLE node with a SOLID fill', () => {
    const json = renderToFigmaJSON()(
      <Document>
        <Page name="Page 1">
          <View
            name="Rectangle 1"
            style={{
              position: 'absolute',
              left: -282,
              top: -153,
              width: 326,
              height: 200,
              backgroundColor: 'rgba(0,255,26,1)',
            }}
          />
        </Page>
      </Document>,
      { lastModified: '2024-06-14T13:14:19Z', name: 'New File 1' },
    );

    const page = json.document.children[0];
    expect(page.children).toHaveLength(1);

    const rect = page.children[0];
    expect(rect.id).toBe('1:2');
    expect(rect.type).toBe('RECTANGLE');
    expect(rect.absoluteBoundingBox).toEqual({ x: -282, y: -153, width: 326, height: 200 });
    expect(rect.size).toEqual({ x: 326, y: 200 });
    expect(rect.fills).toHaveLength(1);
    expect(rect.fills[0].type).toBe('SOLID');
    expect(rect.fills[0].color.g).toBeCloseTo(1);
    expect(rect.fillGeometry).toEqual([
      { path: 'M0 0L326 0L326 200L0 200L0 0Z', windingRule: 'NONZERO' },
    ]);
    expect(rect.strokes).toEqual([]);

    expect(json).toMatchSnapshot();
  });
});
