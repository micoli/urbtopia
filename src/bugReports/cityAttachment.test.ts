import { describe, expect, it } from 'vitest';
import { fromBase64, gunzip, prepareCityAttachment, toBase64 } from './cityAttachment';
import { INLINE_CITY_MAX_BYTES } from './limits';

describe('prepareCityAttachment', () => {
  it('keeps a small City as JSON', async () => {
    const result = await prepareCityAttachment('{"a":1}');
    expect(result).toEqual({ ok: true, attachment: { kind: 'json', value: { a: 1 } } });
  });

  it('refuses a small text that is not JSON', async () => {
    expect(await prepareCityAttachment('not json')).toEqual({ ok: false, reason: 'unreadable' });
  });

  it('gzips a City above 1 MB and the text comes back unchanged', async () => {
    const text = JSON.stringify({ filler: 'x'.repeat(INLINE_CITY_MAX_BYTES + 10) });
    const result = await prepareCityAttachment(text);
    if (!result.ok || result.attachment.kind !== 'gzip') throw new Error('expected a gzip attachment');
    const restored = new TextDecoder().decode(await gunzip(fromBase64(result.attachment.base64)));
    expect(restored).toBe(text);
  });

  it('refuses a City that stays above 2 MB once compressed', async () => {
    const noise = Array.from({ length: 4_500_000 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
    const result = await prepareCityAttachment(JSON.stringify({ noise }));
    expect(result).toEqual({ ok: false, reason: 'too-large' });
  });
});

describe('base64', () => {
  it('round-trips bytes larger than one chunk', () => {
    const bytes = Uint8Array.from({ length: 100_000 }, (_, index) => index % 256);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
  });
});
