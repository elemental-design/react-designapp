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
// including the `169.254.169.254` cloud metadata address, RFC1918 private
// ranges, their IPv6 equivalents, and common alternate IPv4 encodings such
// as a plain decimal/hex integer). This is a best-effort, literal
// IP/hostname check -- it does not perform DNS resolution, so it cannot
// catch DNS-rebinding attacks where a hostname's A/AAAA record changes
// between this check and curl's own lookup. Redirects are intentionally
// *not* followed (no `-L`) so that an allowed host can't bounce the request
// to a blocked internal address after this check runs. Callers that accept
// image URLs from untrusted input should perform additional validation
// (e.g. an allow-list) upstream.
function isBlockedIPv4(host: string): boolean {
  // Standard dotted-quad form.
  const dotted = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (dotted) {
    const [a, b] = dotted.slice(1, 3).map(Number);
    return (
      a === 127 || // loopback
      a === 10 || // 10.0.0.0/8
      (a === 172 && b >= 16 && b <= 31) || // 172.16.0.0/12
      (a === 192 && b === 168) || // 192.168.0.0/16
      (a === 169 && b === 254) // 169.254.0.0/16 (incl. cloud metadata)
    );
  }

  // Alternate encodings (plain decimal or hex integer, e.g.
  // `http://2130706433/` or `http://0x7f000001/`, both equivalent to
  // `127.0.0.1`) that browsers/curl still resolve as IPv4 addresses.
  const isDecimal = /^\d+$/.test(host);
  const isHex = /^0x[0-9a-f]+$/.test(host);
  if (!isDecimal && !isHex) {
    return false;
  }

  const num = isHex ? parseInt(host, 16) : parseInt(host, 10);
  if (!Number.isFinite(num) || num < 0 || num > 0xffffffff) {
    return false;
  }

  const a = (num >>> 24) & 0xff;
  const b = (num >>> 16) & 0xff;
  return (
    a === 127 ||
    a === 10 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254)
  );
}

function isBlockedIPv6(host: string): boolean {
  if (host === '::1' || host === '0:0:0:0:0:0:0:1') {
    return true;
  }
  if (host.startsWith('fe80:') || host.startsWith('fc00:') || host.startsWith('fd')) {
    return true; // link-local and unique-local (fc00::/7)
  }
  // IPv4-mapped IPv6 addresses, e.g. `::ffff:127.0.0.1`.
  const mapped = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(host);
  if (mapped) {
    return isBlockedIPv4(mapped[1]);
  }
  return false;
}

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (host === 'localhost' || host === '0.0.0.0') {
    return true;
  }

  return host.includes(':') ? isBlockedIPv6(host) : isBlockedIPv4(host);
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
    // Note: `-L` (follow redirects) is intentionally omitted -- see the
    // `isBlockedHost` comment above.
    return execFileSync('curl', ['-s', '--max-time', '5', '--', url], {
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
