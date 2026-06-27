/**
 * lib/webauthn.ts
 *
 * Cryptographic utilities for parsing WebAuthn (Passkey) responses.
 *
 * The WebAuthn spec returns signatures in ASN.1 DER format, but Soroban's
 * secp256r1 host function requires a raw 64-byte r||s representation.
 * This module handles that conversion plus public key extraction.
 */

// ─────────────────────────────────────────────────────────────────────────────
//  ASN.1 DER → Raw 64-byte signature conversion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Converts an ASN.1 DER-encoded ECDSA signature to raw 64-byte r||s format.
 *
 * DER structure:
 *   0x30 [total-len] 0x02 [r-len] [r-bytes] 0x02 [s-len] [s-bytes]
 *
 * Soroban requires exactly 32 bytes each for r and s (zero-padded if shorter,
 * trimmed of leading 0x00 padding bytes if longer).
 *
 * @param derSignature - Base64URL-encoded DER signature from WebAuthn assertion
 * @returns Uint8Array of exactly 64 bytes: [r(32)] || [s(32)]
 */
export function derToRawSignature(derSignature: string): Uint8Array {
  const der = base64UrlToBytes(derSignature);

  // Validate DER sequence tag
  if (der[0] !== 0x30) {
    throw new Error(`Invalid DER signature: expected 0x30 sequence tag, got 0x${der[0].toString(16)}`);
  }

  let offset = 2; // skip 0x30 and total-length byte

  // Parse r
  if (der[offset] !== 0x02) throw new Error("Invalid DER: expected 0x02 integer tag for r");
  offset++;
  const rLen = der[offset++];
  const rBytes = der.slice(offset, offset + rLen);
  offset += rLen;

  // Parse s
  if (der[offset] !== 0x02) throw new Error("Invalid DER: expected 0x02 integer tag for s");
  offset++;
  const sLen = der[offset++];
  const sBytes = der.slice(offset, offset + sLen);

  return concatRawComponents(rBytes, sBytes);
}

/**
 * Pads or trims a DER integer component to exactly 32 bytes.
 * DER may add a leading 0x00 byte to preserve sign bit — strip it.
 */
function normalizeTo32Bytes(component: Uint8Array): Uint8Array {
  const out = new Uint8Array(32);

  if (component.length > 32) {
    // Strip leading zero-padding (DER sign bit preservation)
    const trimmed = component.slice(component.length - 32);
    out.set(trimmed);
  } else {
    // Right-align shorter values with zero-padding on the left
    out.set(component, 32 - component.length);
  }

  return out;
}

/** Concatenates normalized r and s into the 64-byte raw format. */
function concatRawComponents(r: Uint8Array, s: Uint8Array): Uint8Array {
  const raw = new Uint8Array(64);
  raw.set(normalizeTo32Bytes(r), 0);
  raw.set(normalizeTo32Bytes(s), 32);
  return raw;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Public Key Extraction from AuthenticatorData
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts the raw uncompressed secp256r1 public key (64 bytes, no 0x04 prefix)
 * from the authenticatorData returned in a WebAuthn registration response.
 *
 * AuthenticatorData layout:
 *   [32 bytes] rpIdHash
 *   [1 byte]   flags
 *   [4 bytes]  signCount
 *   [16 bytes] aaguid         (if attested credential data present)
 *   [2 bytes]  credentialIdLen
 *   [N bytes]  credentialId
 *   [M bytes]  credentialPublicKey (CBOR-encoded COSE key)
 *
 * @param authData - Raw authenticatorData bytes from registration ceremony
 * @returns 64-byte uncompressed public key (x || y coordinates)
 */
export function extractPublicKeyFromAuthData(authData: Uint8Array): Uint8Array {
  // Skip rpIdHash(32) + flags(1) + signCount(4) = 37 bytes
  let offset = 37;

  // Skip aaguid (16 bytes)
  offset += 16;

  // Read credential ID length (big-endian uint16)
  const credIdLen = (authData[offset] << 8) | authData[offset + 1];
  offset += 2;

  // Skip credential ID
  offset += credIdLen;

  // The remaining bytes are the CBOR-encoded COSE key
  const coseKeyBytes = authData.slice(offset);
  return decodeCosePublicKey(coseKeyBytes);
}

/**
 * Minimal CBOR decoder for COSE EC2 keys (type -7 = ES256 / secp256r1).
 *
 * COSE EC2 key map:
 *   1  → kty   (2 = EC2)
 *   3  → alg   (-7 = ES256)
 *   -1 → crv   (1 = P-256)
 *   -2 → x     (32 bytes)
 *   -3 → y     (32 bytes)
 *
 * @returns 64-byte buffer: [x(32)] || [y(32)]
 */
function decodeCosePublicKey(coseBytes: Uint8Array): Uint8Array {
  // This is a minimal CBOR map decoder for the COSE key structure.
  // A full CBOR library (like 'cbor-web') can be used in production.
  // We locate the -2 (x) and -3 (y) keys by scanning for their CBOR encoding.

  const result = new Uint8Array(64);
  let i = 1; // skip map header byte

  while (i < coseBytes.length) {
    // Read key
    const keyByte = coseBytes[i++];

    // Negative integer: CBOR encoding is 0x20 | (abs(n) - 1)
    // -2 → 0x21, -3 → 0x22
    if (keyByte === 0x21 || keyByte === 0x22) {
      // Value is a 32-byte bstr: 0x58 0x20 [32 bytes]
      if (coseBytes[i] === 0x58 && coseBytes[i + 1] === 0x20) {
        i += 2;
        const coord = coseBytes.slice(i, i + 32);
        if (keyByte === 0x21) result.set(coord, 0);   // x
        else                  result.set(coord, 32);  // y
        i += 32;
      } else {
        i++; // skip unexpected value
      }
    } else {
      // Skip over the value bytes (simplified — handles common CBOR types)
      i = skipCborValue(coseBytes, i);
    }
  }

  return result;
}

/** Skips one CBOR value at position `i`, returning the new offset. */
function skipCborValue(bytes: Uint8Array, i: number): number {
  const b = bytes[i++];
  const major = b >> 5;
  const info  = b & 0x1f;

  if (major === 0 || major === 1) return i; // uint / nint (1 byte payload already consumed)
  if (major === 2 || major === 3) {         // bstr / tstr
    if (info <= 23) return i + info;
    if (info === 24) return i + 1 + bytes[i];
    if (info === 25) return i + 2 + ((bytes[i] << 8) | bytes[i + 1]);
  }
  return i; // fallback
}

// ─────────────────────────────────────────────────────────────────────────────
//  Encoding / Decoding utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Decodes a Base64URL string to a Uint8Array. */
export function base64UrlToBytes(b64url: string): Uint8Array {
  const base64 = b64url
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(b64url.length / 4) * 4, "=");
  const raw = atob(base64);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Encodes a Uint8Array to a Base64URL string. */
export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Extracts the raw authData byte array from a CBOR-encoded attestationObject.
 * This scans for the "authData" key marker and parses its length.
 */
export function extractAuthDataFromAttestationObject(attObj: Uint8Array): Uint8Array {
  // CBOR representation of text key "authData":
  // 0x68 (text string length 8) followed by "authData" ASCII bytes
  const marker = new Uint8Array([0x68, 0x61, 0x75, 0x74, 0x68, 0x44, 0x61, 0x74, 0x61]);
  let index = -1;
  for (let i = 0; i <= attObj.length - marker.length; i++) {
    let match = true;
    for (let j = 0; j < marker.length; j++) {
      if (attObj[i + j] !== marker[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      index = i;
      break;
    }
  }

  if (index === -1) {
    throw new Error("Invalid attestationObject: 'authData' key not found");
  }

  // The value starts after the marker
  let valOffset = index + marker.length;
  const typeByte = attObj[valOffset];

  if (typeByte === 0x58) { // Byte string with 1-byte length
    const len = attObj[valOffset + 1];
    return attObj.slice(valOffset + 2, valOffset + 2 + len);
  } else if (typeByte === 0x59) { // Byte string with 2-byte length
    const len = (attObj[valOffset + 1] << 8) | attObj[valOffset + 2];
    return attObj.slice(valOffset + 3, valOffset + 3 + len);
  } else {
    if (typeByte >= 0x40 && typeByte <= 0x57) {
      const len = typeByte - 0x40;
      return attObj.slice(valOffset + 1, valOffset + 1 + len);
    }
    throw new Error(`Unexpected CBOR type for authData: 0x${typeByte.toString(16)}`);
  }
}

/** Converts a Uint8Array to a lowercase hex string. */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Hashes the clientDataJSON and authenticatorData as required by WebAuthn spec
 * to produce the 32-byte message hash that was signed by the device.
 *
 * Signature message = SHA-256(authenticatorData || SHA-256(clientDataJSON))
 */
export async function computeSignatureMessage(
  authenticatorData: Uint8Array,
  clientDataJSON: string,
): Promise<Uint8Array> {
  const clientDataBytes = new TextEncoder().encode(clientDataJSON);
  const clientDataHash  = new Uint8Array(
    await crypto.subtle.digest("SHA-256", clientDataBytes)
  );

  const message = new Uint8Array(authenticatorData.length + clientDataHash.length);
  message.set(authenticatorData);
  message.set(clientDataHash, authenticatorData.length);

  return new Uint8Array(await crypto.subtle.digest("SHA-256", message));
}

// ─────────────────────────────────────────────────────────────────────────────
//  TypeScript interfaces for payload validation
// ─────────────────────────────────────────────────────────────────────────────

export interface WebAuthnAssertionPayload {
  id: string;
  rawId: string;
  type: string;
  response: {
    authenticatorData: string;
    clientDataJSON: string;
    signature: string;
    userHandle?: string;
  };
}

export interface WebAuthnRegistrationPayload {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
    transports?: string[];
  };
}

