import { makeImageDataFromUrl } from '../../../../src/platformBridges/node/makeImageDataFromUrl';

const ERROR_IMAGE =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mM8w8DwHwAEOQHNmnaaOAAAAABJRU5ErkJggg==';

describe('platformBridges/node makeImageDataFromUrl', () => {
  it('returns the error-image placeholder for an empty url', () => {
    expect(makeImageDataFromUrl()).toBe(ERROR_IMAGE);
  });

  it('decodes a data: URI directly', () => {
    // A 1x1 red PNG, base64-encoded.
    const pngBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(makeImageDataFromUrl(`data:image/png;base64,${pngBase64}`)).toBe(pngBase64);
  });

  it('falls back to the error-image placeholder for internal/private hosts', () => {
    expect(makeImageDataFromUrl('http://localhost/image.png')).toBe(ERROR_IMAGE);
    expect(makeImageDataFromUrl('http://127.0.0.1/image.png')).toBe(ERROR_IMAGE);
    expect(makeImageDataFromUrl('http://169.254.169.254/latest/meta-data/')).toBe(ERROR_IMAGE);
    expect(makeImageDataFromUrl('http://10.0.0.5/image.png')).toBe(ERROR_IMAGE);
    expect(makeImageDataFromUrl('http://192.168.1.1/image.png')).toBe(ERROR_IMAGE);
    expect(makeImageDataFromUrl('http://172.16.0.1/image.png')).toBe(ERROR_IMAGE);
  });

  it('falls back to the error-image placeholder for alternate IPv4 encodings', () => {
    // 2130706433 and 0x7f000001 are both equivalent to 127.0.0.1.
    expect(makeImageDataFromUrl('http://2130706433/image.png')).toBe(ERROR_IMAGE);
    expect(makeImageDataFromUrl('http://0x7f000001/image.png')).toBe(ERROR_IMAGE);
  });

  it('falls back to the error-image placeholder for internal IPv6 hosts', () => {
    expect(makeImageDataFromUrl('http://[::1]/image.png')).toBe(ERROR_IMAGE);
    expect(makeImageDataFromUrl('http://[fe80::1]/image.png')).toBe(ERROR_IMAGE);
    expect(makeImageDataFromUrl('http://[::ffff:127.0.0.1]/image.png')).toBe(ERROR_IMAGE);
  });

  it('falls back to the error-image placeholder for a missing local file', () => {
    expect(makeImageDataFromUrl('/no/such/file.png')).toBe(ERROR_IMAGE);
  });
});
