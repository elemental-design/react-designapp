import * as React from 'react';
import { Document } from '../../../src/components/Document';
import { Page } from '../../../src/components/Page';
import { Image } from '../../../src/components/Image';
import { renderToFigmaJSON } from '../../../src/renderToFigmaJSON';

// A 1x1 red PNG, base64-encoded, served as a `data:` URI so the test never
// touches the network (deterministic, works offline).
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const DATA_URI = `data:image/png;base64,${PNG_BASE64}`;

describe('Figma backend: image', () => {
  it('generates an IMAGE fill with embedded base64 image data', () => {
    const json = renderToFigmaJSON()(
      <Document>
        <Page name="Page 1">
          <Image
            name="Avatar"
            source={DATA_URI}
            style={{ width: 100, height: 100 }}
          />
        </Page>
      </Document>,
      { lastModified: '2024-06-14T13:14:19Z', name: 'New File 1' },
    );

    const page = json.document.children[0];
    const image = page.children[0];

    expect(image.type).toBe('RECTANGLE');
    expect(image.name).toBe('Avatar');
    expect(image.fills).toHaveLength(1);
    expect(image.fills[0].type).toBe('IMAGE');
    expect(image.fills[0].imageData).toBe(PNG_BASE64);
    expect(image.fills[0].scaleMode).toBeDefined();

    expect(json).toMatchSnapshot();
  });

  it('falls back to the error-image placeholder for a missing/invalid source', () => {
    const json = renderToFigmaJSON()(
      <Document>
        <Page name="Page 1">
          <Image name="Broken" style={{ width: 50, height: 50 }} />
        </Page>
      </Document>,
      { lastModified: '2024-06-14T13:14:19Z', name: 'New File 1' },
    );

    const page = json.document.children[0];
    const image = page.children[0];

    expect(image.fills[0].type).toBe('IMAGE');
    expect(typeof image.fills[0].imageData).toBe('string');
    expect((image.fills[0].imageData as string).length).toBeGreaterThan(0);
  });
});
