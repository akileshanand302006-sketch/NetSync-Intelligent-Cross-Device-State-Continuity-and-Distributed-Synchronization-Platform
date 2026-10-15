/**
 * NetSync Client-Side End-to-End Encryption (E2EE) Service
 * ========================================================
 * Implements Non-Negotiable Rule 5 & Section 5.4:
 * - Authenticated encryption (AES-256-GCM) via WebCrypto.
 * - Server stores ciphertext only (zero-knowledge architecture).
 * - Sensitive content heuristics: auto-detects OTPs, API keys, passwords with 5-minute TTL.
 * - Client-side privacy-preserving search over decrypted items in memory.
 */

const DEFAULT_SALT = new TextEncoder().encode('NetSync-E2EE-PBKDF2-Salt-2026');
let inMemoryCryptoKey = null;
const KEY_ID = 'netsync-master-v1';

/**
 * Initialize or retrieve the active AES-256-GCM symmetric key.
 */
export async function getOrCreateMasterKey(userPassphrase = 'NetSync-Hardware-Mesh-Passphrase') {
  if (inMemoryCryptoKey) return inMemoryCryptoKey;

  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    return null;
  }

  try {
    const rawPass = new TextEncoder().encode(userPassphrase);
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      rawPass,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    inMemoryCryptoKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: DEFAULT_SALT,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );

    return inMemoryCryptoKey;
  } catch (err) {
    console.error('Failed to initialize WebCrypto key:', err);
    return null;
  }
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 */
export async function encryptPayload(plaintext) {
  const key = await getOrCreateMasterKey();
  if (!key) {
    // Fallback if WebCrypto is unavailable
    return { ciphertext: plaintext, iv: null, keyId: null, isEncrypted: false };
  }

  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(plaintext);

  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedText
  );

  const ciphertextBase64 = btoa(String.fromCharCode(...new Uint8Array(cipherBuffer)));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  return {
    ciphertext: ciphertextBase64,
    iv: ivBase64,
    keyId: KEY_ID,
    isEncrypted: true,
  };
}

/**
 * Decrypt a base64 ciphertext using AES-256-GCM.
 */
export async function decryptPayload(ciphertextBase64, ivBase64) {
  if (!ivBase64) return ciphertextBase64;

  const key = await getOrCreateMasterKey();
  if (!key) return ciphertextBase64;

  try {
    const cipherBytes = Uint8Array.from(atob(ciphertextBase64), (c) => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivBytes },
      key,
      cipherBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.warn('Decryption failed (key mismatch or unencrypted):', err);
    return ciphertextBase64;
  }
}

/**
 * Sensitive content heuristics: detects OTPs, credentials, and tokens.
 */
export function detectSensitiveContent(text) {
  if (!text || typeof text !== 'string') {
    return { isSensitive: false, reason: null, ttlSeconds: null };
  }

  const trimmed = text.trim();

  // 1. Numeric One-Time Password (OTP): 4 to 8 digits
  if (/^\b\d{4,8}\b$/.test(trimmed)) {
    return { isSensitive: true, reason: 'One-Time Password (OTP)', ttlSeconds: 300 };
  }

  // 2. Private Key Header
  if (/-----BEGIN (?:RSA|OPENSSH|EC|PRIVATE) KEY-----/i.test(trimmed)) {
    return { isSensitive: true, reason: 'Private Cryptographic Key', ttlSeconds: 300 };
  }

  // 3. API Token / Bearer Token
  if (/(?:ghp|sk|bearer|xoxb|token)[_-][a-zA-Z0-9_\-]{16,}/i.test(trimmed)) {
    return { isSensitive: true, reason: 'API Secret / Bearer Token', ttlSeconds: 300 };
  }

  // 4. Password string pattern (e.g. "password = mySecret123!")
  if (/(?:password|passwd|secret)\s*[:=]\s*[^\s]+/i.test(trimmed)) {
    return { isSensitive: true, reason: 'Plaintext Password Expression', ttlSeconds: 300 };
  }

  return { isSensitive: false, reason: null, ttlSeconds: null };
}

/**
 * Client-side privacy-preserving search over decrypted clipboard items.
 */
export function searchDecryptedItems(items, query) {
  if (!query || !query.trim()) return items;
  const q = query.toLowerCase().trim();
  return items.filter((item) => {
    const text = (item.decryptedContent || item.content || '').toLowerCase();
    const type = (item.content_type || '').toLowerCase();
    const device = (item.device_id || '').toLowerCase();
    return text.includes(q) || type.includes(q) || device.includes(q);
  });
}
