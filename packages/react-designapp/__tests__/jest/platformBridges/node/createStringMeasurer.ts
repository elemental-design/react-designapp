import { createStringMeasurer } from '../../../../src/platformBridges/node/createStringMeasurer';

function measure(content: string, textStyles: any = {}) {
  return createStringMeasurer([{ content, textStyles }], Infinity);
}

describe('Node text measurement', () => {
  it('rounds Arial Bold label advances up to avoid wrapping in Figma', () => {
    expect(measure('Continue', { fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold' })).toEqual({
      width: 70,
      height: 20,
    });
    expect(measure('Continue', { fontFamily: 'Arial', fontSize: 16 })).toEqual({
      width: 65,
      height: 20,
    });
  });

  it('distinguishes narrow and wide Arial glyphs', () => {
    expect(measure('WWW').width).toBeGreaterThan(measure('iii').width);
  });

  it('retains heuristic measurement for other fonts and non-ASCII glyphs', () => {
    expect(measure('Continue', { fontFamily: 'Custom', fontSize: 16, fontWeight: 'bold' })).toEqual(
      { width: 69, height: 20 },
    );
    expect(measure('😀', { fontFamily: 'Arial', fontSize: 16 })).toEqual({ width: 16, height: 20 });
  });
});
