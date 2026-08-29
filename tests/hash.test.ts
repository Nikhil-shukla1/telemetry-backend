import { describe, it, expect } from 'vitest';
import { generateMessageHash, canonicalize } from '../src/utils/hash.js';

describe('Message Hash & Canonicalization Utility Tests', () => {
  it('canonicalizes objects by sorting keys alphabetically', () => {
    const objA = { b: 2, a: 1, c: { z: 26, y: 25 } };
    const objB = { a: 1, c: { y: 25, z: 26 }, b: 2 };

    const canonicalA = canonicalize(objA);
    const canonicalB = canonicalize(objB);

    expect(JSON.stringify(canonicalA)).toBe(JSON.stringify(canonicalB));
  });

  it('generates identical SHA-256 message hashes for identical payloads with different key orders', () => {
    const ident = 'vehicle-001';
    const ts = 1787042687000;
    const payload1 = {
      ident,
      timestamp: ts,
      'position.speed': 18.5,
      'position.latitude': 22.051,
    };
    const payload2 = {
      'position.latitude': 22.051,
      ident,
      'position.speed': 18.5,
      timestamp: ts,
    };

    const hash1 = generateMessageHash(ident, ts, payload1);
    const hash2 = generateMessageHash(ident, ts, payload2);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // Valid SHA-256 hex string
  });

  it('generates different message hashes when timestamp or ident or payload values differ', () => {
    const hash1 = generateMessageHash('vehicle-001', 1000, { speed: 10 });
    const hash2 = generateMessageHash('vehicle-001', 1001, { speed: 10 });
    const hash3 = generateMessageHash('vehicle-002', 1000, { speed: 10 });

    expect(hash1).not.toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });
});
