import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, renameSync, writeFileSync } from 'node:fs';
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

// Kokoro speaks about this many characters a second; a line not yet spoken is given this length, a little long, so that the voice never runs over the next moment of the film.
const CHARACTERS_PER_SECOND = 13;

const fileOf = (text: string, voice: string, speed: number): string => join(CACHE_DIR, `${createHash('sha256').update(`${voice}|${speed}|${text}`).digest('hex').slice(0, 16)}.mp3`);

// The line as the film is shot: its real length when it was spoken before, else an estimate. Nothing is synthesised: the voices are made after the shooting (`speak`), which keeps Kokoro from slowing the game down.
export function plan(text: string, voice: string, speed = 1): Speech {
  mkdirSync(CACHE_DIR, { recursive: true });
  const file = fileOf(text, voice, speed);
  return { file, seconds: existsSync(file) ? durationOf(file) : text.length / CHARACTERS_PER_SECOND / speed + 0.2 };
}

const isUp = async (): Promise<boolean> => {
  try {
    return (await fetch(`${KOKORO_URL}/v1/audio/voices`, { signal: AbortSignal.timeout(2000) })).ok;
  } catch {
    return false;
  }
};

// Uses the server that answers, else starts the container (CPU image, models baked in) and waits for it. Videos filmed side by side ask once together.
let starting: Promise<void> | undefined;
export function ensureKokoro(): Promise<void> {
  starting ??= start().finally(() => { starting = undefined; });
  return starting;
}

async function start(): Promise<void> {
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
  const file = fileOf(text, voice, speed);
  if (!existsSync(file)) {
    await ensureKokoro();
    const response = await fetch(`${KOKORO_URL}/v1/audio/speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'kokoro', input: text, voice, speed, response_format: 'mp3' }),
    });
    if (!response.ok) throw new Error(`Kokoro answered ${response.status} for "${text}"`);
    // Written aside then renamed: a video filmed side by side never reads a half-written line.
    const partial = `${file}.${process.pid}.${Date.now()}.part`;
    writeFileSync(partial, Buffer.from(await response.arrayBuffer()));
    renameSync(partial, file);
  }
  return { file, seconds: durationOf(file) };
}
