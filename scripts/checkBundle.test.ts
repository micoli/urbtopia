import { describe, expect, it } from 'vitest';
import { findLeakedSupabaseKey, guideScriptsOf, mainEntryOf } from './checkBundle';

const jwt = (payload: object) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.c2lnbmF0dXJlc2lnbmF0dXJl`;

describe('findLeakedSupabaseKey', () => {
  it('accepts the library marker and a publishable key', () => {
    expect(findLeakedSupabaseKey('e.startsWith(`sb_secret_`)||x')).toBeNull();
    expect(findLeakedSupabaseKey('"sb_publishable_AbCdEfGhIjKlMnOpQr"')).toBeNull();
    expect(findLeakedSupabaseKey(`"${jwt({ role: 'anon' })}"`)).toBeNull();
  });

  it('rejects a secret key and a service_role JWT', () => {
    expect(findLeakedSupabaseKey('"sb_secret_AbCdEfGhIjKlMnOpQrStUv"')).not.toBeNull();
    expect(findLeakedSupabaseKey(`"${jwt({ role: 'service_role' })}"`)).not.toBeNull();
  });
});

describe('mainEntryOf', () => {
  it('finds the entry script of the built index.html', () => {
    expect(mainEntryOf('<script type="module" crossorigin src="./assets/index-abc.js"></script>')).toBe('assets/index-abc.js');
  });
});

describe('guideScriptsOf', () => {
  it('lists the entry and preloaded scripts of the built Guide page', () => {
    const html = '<script type="module" crossorigin src="../assets/guide-abc.js"></script><link rel="modulepreload" crossorigin href="../assets/shared-def.js"><link rel="stylesheet" href="../assets/guide-abc.css">';
    expect(guideScriptsOf(html)).toEqual(['assets/guide-abc.js', 'assets/shared-def.js']);
  });
});
