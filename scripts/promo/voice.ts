import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Voice over: Kokoro (82M, StyleTTS 2) served by Kokoro-FastAPI in Docker, through its OpenAI-compatible speech endpoint.
const KOKORO_URL = process.env.KOKORO_URL ?? 'http://localhost:8880';
const KOKORO_IMAGE = 'ghcr.io/remsky/kokoro-fastapi-cpu:v0.10.0';
const KOKORO_CONTAINER = 'urbtopia-kokoro';
const CACHE_DIR = join(import.meta.dirname, '../../tmp/promo/voice');

export const DEFAULT_VOICES = { en: 'af_heart', fr: 'ff_siwis' } as const;

export interface Speech {
  file: string;
  seconds: number;
}

const isUp = async (): Promise<boolean> => {
  try {
    return (await fetch(`${KOKORO_URL}/v1/audio/voices`, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
};

// Uses the server that answers, else starts the container (CPU image, models baked in) and waits for it.
export async function ensureKokoro(): Promise<void> {
  if (await isUp()) return;
  console.log(`Kokoro: starting ${KOKORO_IMAGE}`);
  try {
    execFileSync('docker', ['start', KOKORO_CONTAINER], { stdio: 'ignore' });
  } catch {
    execFileSync('docker', ['run', '-d', '--name', KOKORO_CONTAINER, '-p', '8880:8880', KOKORO_IMAGE], { stdio: 'inherit' });
  }
  for (let attempt = 0; attempt < 60; attempt++) {
    if (await isUp()) return;
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('Kokoro did not answer in two minutes');
}

const durationOf = (file: string): number => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());

// A line already spoken is not synthesised again: the file is named by the hash of the text, the voice and the speed.
export async function speak(text: string, voice: string, speed = 1): Promise<Speech> {
  mkdirSync(CACHE_DIR, { recursive: true });
  const file = join(CACHE_DIR, `${createHash('sha256').update(`${voice}|${speed}|${text}`).digest('hex').slice(0, 16)}.mp3`);
  if (!existsSync(file)) {
    await ensureKokoro();
    const response = await fetch(`${KOKORO_URL}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'kokoro', input: text, voice, speed, response_format: 'mp3' }),
    });
    if (!response.ok) throw new Error(`Kokoro answered ${response.status} for "${text}"`);
    writeFileSync(file, Buffer.from(await response.arrayBuffer()));
  }
  return { file, seconds: durationOf(file) };
}
