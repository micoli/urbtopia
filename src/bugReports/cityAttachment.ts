import { COMPRESSED_CITY_MAX_BYTES, INLINE_CITY_MAX_BYTES } from './limits';

export type CityAttachment = { kind: 'json'; value: unknown } | { kind: 'gzip'; base64: string };

export type CityAttachmentResult = { ok: true; attachment: CityAttachment } | { ok: false; reason: 'too-large' | 'unreadable' };

export async function prepareCityAttachment(cityText: string): Promise<CityAttachmentResult> {
  const bytes = new TextEncoder().encode(cityText);
  if (bytes.length <= INLINE_CITY_MAX_BYTES) return inlineAttachment(cityText);
  const compressed = await gzip(bytes);
  if (compressed.length > COMPRESSED_CITY_MAX_BYTES) return { ok: false, reason: 'too-large' };
  return { ok: true, attachment: { kind: 'gzip', base64: toBase64(compressed) } };
}

function inlineAttachment(cityText: string): CityAttachmentResult {
  try {
    return { ok: true, attachment: { kind: 'json', value: JSON.parse(cityText) } };
  } catch {
    return { ok: false, reason: 'unreadable' };
  }
}

export async function gzip(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return pipe(bytes, new CompressionStream('gzip'));
}

export async function gunzip(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  return pipe(bytes, new DecompressionStream('gzip'));
}

async function pipe(bytes: Uint8Array<ArrayBuffer>, transform: CompressionStream | DecompressionStream): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([bytes]).stream().pipeThrough(transform);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

const CHUNK = 0x8000;

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let index = 0; index < bytes.length; index += CHUNK) binary += String.fromCharCode(...bytes.subarray(index, index + CHUNK));
  return btoa(binary);
}

export function fromBase64(base64: string): Uint8Array<ArrayBuffer> {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
