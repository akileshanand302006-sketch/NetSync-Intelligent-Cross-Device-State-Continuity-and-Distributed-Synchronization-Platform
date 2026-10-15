# ADR 0005: End-to-End Encryption, Zero-Knowledge Storage, and Device Pairing

**Status:** Accepted  
**Date:** October 2026  
**Deciders:** NetSync Core Team  
**Consulted:** Section 3, Section 5.3, Section 5.4, Section 8.4

---

## Context and Problem Statement

NetSync synchronizes clipboard data, active workspace contents, and device tokens across laptops, tablets, and phones. Clipboard contents regularly include sensitive data:
- One-Time Passwords (OTPs) and multi-factor authentication codes
- Passwords and login credentials
- Private API keys, JWT tokens, and git commit credentials

If stored in plaintext on the central Core database or transmitted unencrypted through relays, any server-side breach compromises user secrets. Furthermore, unauthorized device pairing could allow an attacker on the same Wi-Fi network to intercept state feeds.

---

## Decision Drivers

1. **Section 5.4 & 8.4 Requirement:** End-to-end encrypted items (AES-256-GCM / XChaCha20-Poly1305 through WebCrypto / libsodium); server stores ciphertext only; client-side search (MiniSearch) over decrypted items.
2. **Section 5.3 Requirement:** QR or code pairing with a Short Authentication String (6 digits on both screens) over an ephemeral X25519 exchange; per-device Ed25519 identity.
3. **Sensitive Content Heuristics:** Automatic TTL expiration and quick purge for OTP and password patterns.

---

## Decision Outcome

Chosen Option: **Standard Authenticated Encryption (AES-GCM-256) via WebCrypto with Client-Side Indexing and SAS Ephemeral Pairing**.

### Implementation Specification:

### 1. Zero-Knowledge Server Storage
- The client generates a 256-bit symmetric encryption key derived from user credentials via PBKDF2 / Argon2id with a unique salt.
- Before transmission to the server, clipboard and workspace content payloads are encrypted client-side using `AES-256-GCM` with a 96-bit cryptographically random IV.
- The server stores only:
  - `ciphertext_base64`
  - `iv_base64`
  - `key_id`
  - Non-sensitive metadata (content byte size, MIME category, device ID, created timestamp)
- The server **never** receives the symmetric key or plaintext payload.

### 2. Client-Side Privacy-Preserving Search
- Because the server cannot index ciphertext, search queries run entirely inside the client browser.
- The client decrypts cached items in memory and executes keyword searches using a lightweight in-memory index (`MiniSearch`).

### 3. Ephemeral X25519 Device Pairing & Short Authentication String (SAS)
- When pairing a new device (e.g. Phone with Laptop):
  1. Both devices generate ephemeral X25519 keypairs.
  2. Public keys are exchanged via QR code scan or temporary 6-digit numeric rendezvous.
  3. Both devices compute the shared secret via ECDH.
  4. Both devices derive a 6-digit Short Authentication String (SAS): `HMAC-SHA256(shared_secret, "NetSync-SAS-v1")[:3] mod 1000000`.
  5. The user visually confirms that the identical 6-digit number appears on both screens before trust is established.
  6. This completely prevents Man-in-the-Middle (MITM) attacks on the local network.

### 4. Sensitive Content Hygiene
- Regex heuristics identify OTP patterns (`^\d{6}$`), SSH keys, and password patterns.
- High-sensitivity clipboard items are given an enforced 5-minute TTL, after which they are automatically expunged from memory and storage.

---

## Consequences

### Positive
- Zero-knowledge confidentiality: database administrators, relay servers, or third parties cannot read user clipboard or workspace data.
- Cryptographically verifiable device pairing immune to LAN eavesdropping or impersonation.

### Negative / Trade-offs
- If the user loses their encryption key and recovery phrase, encrypted clipboard history cannot be restored by the server.
