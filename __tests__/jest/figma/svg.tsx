import * as React from 'react';
import { Document } from '../../../src/components/Document';
import { Page } from '../../../src/components/Page';
import Svg from '../../../src/components/Svg';
import { renderToFigmaJSON } from '../../../src/renderToFigmaJSON';

describe('Figma backend: svg', () => {
  it('generates a VECTOR node carrying a flat SVG string', () => {
    const json = renderToFigmaJSON()(
      <Document>
        <Page name="Page 1">
          <Svg name="Icon" width="32" height="32" viewBox="0 0 32 32">
            <Svg.Circle cx={16} cy={16} r={15.5} stroke="black" />
            <Svg.Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M17 8H15V15H8V17H15V24H17V17H24V15H17V8Z"
              fill="black"
            />
          </Svg>
        </Page>
      </Document>,
      { lastModified: '2024-06-14T13:14:19Z', name: 'New File 1' },
    );

    const page = json.document.children[0];
    expect(page.children).toHaveLength(1);

    const svgNode = page.children[0];
    expect(svgNode.id).toBe('1:2');
    expect(svgNode.name).toBe('Icon');
    expect(svgNode.type).toBe('VECTOR');
    // @ts-ignore -- `svg` is a custom extension only present on VECTOR nodes
    expect(svgNode.svg).toContain('<svg');
    // @ts-ignore
    expect(svgNode.svg).toContain('<circle');
    // @ts-ignore
    expect(svgNode.svg).toContain('<path');
    // @ts-ignore
    expect(svgNode.svg).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');

    expect(json).toMatchSnapshot();
  });
});
