import * as React from 'react';
import { Document } from '../../../src/components/Document';
import { Page } from '../../../src/components/Page';
import { View } from '../../../src/components/View';
import { renderToFigmaJSON } from '../../../src/renderToFigmaJSON';

describe('Figma backend: borders, radius, shadows', () => {
  it('maps borderColor/borderWidth to strokes, borderRadius to cornerRadius, box-shadow to effects', () => {
    const json = renderToFigmaJSON()(
      <Document>
        <Page name="Page 1">
          <View
            name="Card"
            style={{
              width: 120,
              height: 80,
              backgroundColor: '#3366ff',
              borderColor: '#000000',
              borderWidth: 2,
              borderRadius: 8,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 10,
            }}
          />
        </Page>
      </Document>,
      { lastModified: '2024-06-14T13:14:19Z', name: 'New File 1' },
    );

    const card = json.document.children[0].children[0];
    expect(card.type).toBe('RECTANGLE');
    expect(card.cornerRadius).toBe(8);
    expect(card.strokes).toHaveLength(1);
    expect(card.strokeWeight).toBe(2);
    expect(card.strokes[0].color).toEqual({ r: 0, g: 0, b: 0, a: 1 });

    expect(card.effects).toHaveLength(1);
    expect(card.effects[0].type).toBe('DROP_SHADOW');
    expect(card.effects[0].radius).toBe(10);
    expect(card.effects[0].offset).toEqual({ x: 0, y: 4 });
    expect(card.effects[0].color.a).toBeCloseTo(0.5);

    expect(json).toMatchSnapshot();
  });
});
