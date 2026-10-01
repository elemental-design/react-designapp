import { readFileSync, existsSync } from 'fs';
import { execFileSync } from 'child_process';
import { URL } from 'url';

// Pure JS re-implementation of the native `makeImageDataFromUrl` bridge
// method (which, on macOS, uses NSData/NSImage/MSImageData). It supports:
//  - `data:` URIs (decoded directly)
//  - local file paths (read synchronously from disk)
//  - `http(s)://` URLs (best-effort synchronous fetch via `curl`, when
//    available, since the bridge interface is synchronous)
// and otherwise falls back to the same 1x1 transparent PNG placeholder used
// by the reference pure-JS `getImageDataFromURL()` implementation.
const ERROR_IMAGE =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mM8w8DwHwAEOQHNmnaaOAAAAABJRU5ErkJggg==';

function isImage(buffer: Buffer): boolean {
  const firstByte = buffer[0];

  // Check the first byte to see if we have an image.
  // 0xFF = JPEG, 0x89 = PNG, 0x47 = GIF, 0x49 = TIFF, 0x4D = TIFF
  return (
    firstByte === 0xff ||
    firstByte === 0x89 ||
    firstByte === 0x47 ||
    firstByte === 0x49 ||
    firstByte === 0x4d
  );
}

function readDataURI(url: string): Buffer | undefined {
  const match = /^data:[^;]+;base64,(.*)$/.exec(url);
  if (!match) {
    return undefined;
  }
  return Buffer.from(match[1], 'base64');
}

function readLocalFile(url: string): Buffer | undefined {
  const path = url.startsWith('file://') ? url.slice('file://'.length) : url;
  if (!existsSync(path)) {
    return undefined;
  }
  try {
    return readFileSync(path);
  } catch (err) {
    return undefined;
  }
}

// Basic SSRF guard: rejects obviously-internal hosts (loopback, link-local
// including the `169.254.169.254` cloud metadata address, and RFC1918
// private ranges) before shelling out to `curl`. This is a best-effort,
// literal-IP/hostname check -- it does not resolve DNS, so it cannot catch
// DNS-rebinding attacks. Callers that accept image URLs from untrusted
// input should perform additional validation (e.g. an allow-list) upstream.
function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase();

  if (host === 'localhost' || host === '::1' || host === '0.0.0.0') {
    return true;
  }

  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ipv4Match) {
    return false;
  }

  const [a, b] = ipv4Match.slice(1, 3).map(Number);
  return (
    a === 127 || // loopback
    a === 10 || // 10.0.0.0/8
    (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
    (a === 192 && b === 168) || // 192.168.0.0/16
    (a === 169 && b === 254) // 169.254.0.0/16 (incl. cloud metadata)
  );
}

function readRemoteURL(url: string): Buffer | undefined {
  try {
    const { hostname } = new URL(url);
    if (isBlockedHost(hostname)) {
      return undefined;
    }

    // `url` is only reached here after `/^https?:\/\//.test(url)` above, so
    // it can never start with `-`/`--`, ruling out curl flag injection via
    // the URL argument.
    // execFileSync keeps this synchronous, matching the bridge interface.
    // `curl` is available on virtually every CI/dev machine; if it's
    // missing this simply falls through to the error-image placeholder.
    return execFileSync('curl', ['-sL', '--max-time', '5', '--', url], {
      maxBuffer: 1024 * 1024 * 10,
    });
  } catch (err) {
    return undefined;
  }
}

export function makeImageDataFromUrl(url?: string): string {
  if (!url) {
    return ERROR_IMAGE;
  }

  let buffer: Buffer | undefined;

  if (url.startsWith('data:')) {
    buffer = readDataURI(url);
  } else if (/^https?:\/\//.test(url)) {
    buffer = readRemoteURL(url);
  } else {
    buffer = readLocalFile(url);
  }

  if (!buffer || buffer.length === 0 || !isImage(buffer)) {
    return ERROR_IMAGE;
  }

  return buffer.toString('base64');
}
