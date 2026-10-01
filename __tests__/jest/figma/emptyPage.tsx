import * as React from 'react';
import { Document } from '../../../src/components/Document';
import { Page } from '../../../src/components/Page';
import { renderToFigmaJSON } from '../../../src/renderToFigmaJSON';

describe('Figma backend: empty page', () => {
  it('generates a document with a single empty CANVAS page', () => {
    const json = renderToFigmaJSON()(
      <Document>
        <Page name="Page 1" />
      </Document>,
      { lastModified: '2024-06-14T13:14:19Z', name: 'New File 1' },
    );

    expect(json.document.id).toBe('0:0');
    expect(json.document.type).toBe('DOCUMENT');
    expect(json.document.children).toHaveLength(1);

    const page = json.document.children[0];
    expect(page.id).toBe('0:1');
    expect(page.type).toBe('CANVAS');
    expect(page.name).toBe('Page 1');
    expect(page.children).toEqual([]);
    expect(page.prototypeStartNodeID).toBeNull();
    expect(page.flowStartingPoints).toEqual([]);
    expect(page.prototypeDevice).toEqual({ type: 'NONE', rotation: 'NONE' });

    expect(json).toMatchSnapshot();
  });
});
