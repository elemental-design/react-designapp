import * as React from 'react';
import { View } from '../../../src/components/View';
import { renderToDesignJSON } from '../../../src/renderToDesignJSON';
import { getBackend, listBackends } from '../../../src/backends';
import NodeBridge from '../../../src/platformBridges/node';

describe('backend registry', () => {
  it('lists the built-in backends', () => {
    expect(listBackends()).toEqual(expect.arrayContaining(['sketch', 'figma']));
  });

  it('throws a helpful error for unknown backends', () => {
    expect(() => getBackend('penpot')).toThrow(/Unknown react-sketchapp backend "penpot"/);
  });

  it('defaults to the sketch backend', () => {
    // The pure Node bridge works for both backends (no native dependency),
    // so we can exercise the Sketch backend headlessly here too.
    const json: any = renderToDesignJSON(<View style={{ width: 10, height: 10 }} />, {
      platformBridge: NodeBridge,
    });
    expect(json._class).toBe('group');
  });

  it('selects the figma backend explicitly', () => {
    const json: any = renderToDesignJSON(<View style={{ width: 10, height: 10 }} />, {
      backend: 'figma',
    });
    expect(json.document).toBeDefined();
    expect(json.editorType).toBe('figma');
  });
});
