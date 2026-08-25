/**
 * Client-side input checks.
 *
 * These mirror the server's rules so the user gets an answer immediately
 * instead of after a round trip. They are a convenience, not a control — the
 * server validates independently and is the only thing that decides what is
 * accepted. Keep the two in step: the URL rules here match
 * `validate_url_shape` in backend/api/url_analyzer.py, and the size limits
 * match `MAX_UPLOAD_BYTES` / `MAX_SCAN_TEXT_CHARS` in settings.
 */

/** Matches the backend's MAX_UPLOAD_BYTES default. */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** Matches the backend's MAX_SCAN_TEXT_CHARS default. */
export const MAX_SCAN_TEXT_CHARS = 20000;

export const ACCEPTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/tiff',
  'image/bmp',
];

/** For the `accept` attribute on a screenshot file input. */
export const IMAGE_ACCEPT_ATTRIBUTE = '.png,.jpg,.jpeg,.webp,.tif,.tiff,.bmp,image/*';

const HOSTNAME_PATTERN = /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;
const IPV4_PATTERN = /^(?:\d{1,3}\.){3}\d{1,3}$/;

/**
 * Check that a string is a web address we can scan.
 *
 * Returns an error message, or null when the input is usable. The scanner used
 * to send anything at all — `urlparse` never throws, so "hello world" came back
 * with a risk score and a reassuring verdict. Telling someone their typo is
 * safe is worse than telling them nothing.
 */
export function validateUrl(value) {
  const candidate = (value || '').trim();

  if (!candidate) return 'Enter the link you want checked.';
  if (candidate.length > 2048) return 'That link is too long to check.';
  if (/\s/.test(candidate)) {
    return "That doesn't look like a link — web addresses don't contain spaces.";
  }

  const schemeMatch = candidate.match(/^([a-z][a-z0-9+.-]*):\/\//i);
  if (schemeMatch) {
    const scheme = schemeMatch[1].toLowerCase();
    if (scheme !== 'http' && scheme !== 'https') {
      return `Only http and https links can be checked, not '${scheme}:'.`;
    }
  } else if (/^[a-z][a-z0-9+.-]*:/i.test(candidate)) {
    const head = candidate.split(':', 1)[0].toLowerCase();
    // "example.com:8080" is a port; "javascript:alert(1)" is a scheme.
    if (!head.includes('.')) {
      return `Only http and https links can be checked, not '${head}:'.`;
    }
  }

  let host;
  try {
    const parsed = new URL(candidate.includes('://') ? candidate : `http://${candidate}`);
    host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  } catch {
    return "That doesn't look like a valid web address. Check it for typos.";
  }

  if (!host) {
    return "That doesn't look like a link. Include the site address, e.g. example.com/page.";
  }

  if (IPV4_PATTERN.test(host)) {
    return host.split('.').every((part) => Number(part) <= 255)
      ? null
      : "That IP address isn't valid.";
  }

  // A bracketed IPv6 literal survives the URL parser; treat it as valid.
  if (host.startsWith('[')) return null;

  if (!host.includes('.')) {
    return "That doesn't look like a full web address. Include the domain ending, e.g. example.com.";
  }

  // `new URL` already converts an internationalised domain to punycode.
  if (!HOSTNAME_PATTERN.test(host)) {
    return "That doesn't look like a valid web address. Check it for typos.";
  }

  return null;
}

/** Human-readable file size, for limit messages. */
export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

/**
 * Check a file before it is uploaded.
 *
 * Returns an error message, or null. Without this the user selects a 400 MB
 * file, waits for the whole upload, and learns from a 413 that it was never
 * going to work.
 */
export function validateUpload(file, { maxBytes = MAX_UPLOAD_BYTES, acceptTypes = null } = {}) {
  if (!file) return 'Choose a file first.';
  if (file.size === 0) return 'That file is empty.';

  if (file.size > maxBytes) {
    return `That file is ${formatBytes(file.size)}. The limit is ${formatBytes(maxBytes)}.`;
  }

  if (acceptTypes && file.type && !acceptTypes.includes(file.type)) {
    return "That file type isn't supported. Upload a PNG, JPEG, WebP, TIFF, or BMP image.";
  }

  return null;
}

/** Check scan text length before sending it. */
export function validateScanText(value, { maxChars = MAX_SCAN_TEXT_CHARS } = {}) {
  const text = value || '';
  if (!text.trim()) return 'Paste the message you want scanned.';
  if (text.length > maxChars) {
    return `That message is ${text.length.toLocaleString()} characters. Keep it under ${maxChars.toLocaleString()}.`;
  }
  return null;
}

/**
 * A deliberately permissive email check: enough to catch a typo, not an attempt
 * to implement RFC 5322. The server validates properly.
 */
export function validateEmail(value) {
  const email = (value || '').trim();
  if (!email) return 'Enter your email address.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address.';
  return null;
}
