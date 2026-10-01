import * as React from 'react';
import { Document } from '../../../src/components/Document';
import { Page } from '../../../src/components/Page';
import { Text } from '../../../src/components/Text';
import { renderToFigmaJSON } from '../../../src/renderToFigmaJSON';

describe('Figma backend: rich text', () => {
  it('produces characterStyleOverrides/styleOverrideTable for nested styled <Text> spans', () => {
    const json = renderToFigmaJSON()(
      <Document>
        <Page name="Page 1">
          <Text
            style={{
              fontFamily: 'Open Sans',
              fontWeight: '800',
              fontStyle: 'italic',
              fontSize: 40,
            }}
          >
            Salut toi coucou{'\n'}
            <Text style={{ fontSize: 20 }}>Nou</Text>
            velle{' '}
            <Text style={{ fontSize: 10, color: 'red' }}>ligne</Text>
          </Text>
        </Page>
      </Document>,
      { lastModified: '2024-06-14T13:14:19Z', name: 'New File 1' },
    );

    const page = json.document.children[0];
    const textNode = page.children[0];

    expect(textNode.type).toBe('TEXT');
    expect(textNode.style.fontFamily).toBe('Open Sans');
    expect(textNode.style.fontSize).toBe(40);
    expect(textNode.style.italic).toBe(true);
    expect(textNode.style.fontWeight).toBe(800);

    // base run (key 0) + 2 distinct override styles (different fontSize's,
    // one of which also has a different fill color)
    const distinctKeys = new Set(textNode.characterStyleOverrides);
    expect(distinctKeys.has(0)).toBe(true);
    expect(distinctKeys.size).toBeGreaterThanOrEqual(3);

    const overrideKeys = Object.keys(textNode.styleOverrideTable);
    expect(overrideKeys.length).toBeGreaterThanOrEqual(2);

    const sizeOverride = Object.values(textNode.styleOverrideTable).find(
      (o: any) => o.fontSize === 20,
    ) as any;
    expect(sizeOverride).toBeDefined();

    const colorOverride = Object.values(textNode.styleOverrideTable).find(
      (o: any) => o.fontSize === 10,
    ) as any;
    expect(colorOverride).toBeDefined();
    expect(colorOverride.fills[0].color.r).toBeCloseTo(1);
    expect(colorOverride.fills[0].color.g).toBeCloseTo(0);

    expect(textNode.characters).toContain('Salut toi coucou');
    expect(textNode.characters).toContain('Nouvelle');
    expect(textNode.characters).toContain('ligne');

    expect(json).toMatchSnapshot();
  });
});
