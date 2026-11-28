import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { assemble } from './assemble.ts';
import { speak } from './voice.ts';
import { sceneHash } from './cache.ts';
import { MUSIC_FILE } from './credits.ts';
import { recordScene, type Recording } from './record.ts';
import { DEFAULT_VIEWPORT, FORMATS, LANGUAGES, type Format, type Language, type Scenario } from './types.ts';

const ROOT = resolve(import.meta.dirname, '../..');
const BASE_URL = process.env.PROMO_URL ?? 'http://127.0.0.1:5175';

const args = process.argv.slice(2);
const option = (flag: string): string | undefined => args.find((arg) => arg.startsWith(`--${flag}=`))?.slice(flag.length + 3);
const name = args.find((arg) => !arg.startsWith('--'));
const fresh = args.includes('--fresh');
const fast = args.includes('--fast');
if (fast) process.env.PROMO_FAST = '1';
const requestedFormat = option('format') ?? 'landscape';
const requested = option('lang') ?? 'all';
const only = option('scene');

const formatsKnown = requestedFormat === 'all' || requestedFormat in FORMATS;
if (!name || !formatsKnown || (requested !== 'all' && !LANGUAGES.includes(requested as Language))) {
  console.error('Usage: node scripts/promo/cli.ts <scenario> [--lang=en|fr|all] [--format=landscape|phone|all] [--voices=during] [--fast] [--fresh] [--scene=<name>]');
  process.exit(1);
}

const { default: loaded } = await import(`./scenarios/${name}.promo.ts`) as { default: Scenario };
const languages = requested === 'all' ? LANGUAGES : [requested as Language];
const formats = (requestedFormat === 'all' ? Object.keys(FORMATS) : [requestedFormat]) as Format[];
const music = loaded.audio ?? (existsSync(join(ROOT, MUSIC_FILE)) ? MUSIC_FILE : undefined);

interface Job {
  language: Language;
  format: Format;
}

// Every video exists in each language and each format: they are filmed one at a time, so that nothing slows the game down while a scene is shot.
const jobs: Job[] = languages.flatMap((language) => formats.map((format): Job => ({ language, format })));
if (option('voices') === 'during') process.env.PROMO_VOICE = 'during';

// The voices are made once the shooting is over: each line of the film is spoken (or read from the voices already made) and its real length is compared with the one the shooting waited for.
async function makeVoices(recordings: Recording[], label: string): Promise<void> {
  for (const recording of recordings) {
    const cues = recording.cues.filter((cue) => cue.text !== undefined);
    for (const [index, cue] of cues.entries()) {
      const speech = await speak(cue.text, cue.voice, cue.speed);
      cue.seconds = speech.seconds;
      const next = cues[index + 1];
      if (next && cue.at + speech.seconds > next.at) console.warn(`[${label}] the voice overruns the next line by ${(cue.at + speech.seconds - next.at).toFixed(1)}s: "${cue.text.slice(0, 50)}…"`);
    }
  }
}

async function film({ language, format }: Job): Promise<void> {
  const scenes = loaded.build(language);
  for (const scene of scenes) {
    scene.options.language = language;
    scene.options.viewport ??= FORMATS[format];
  }
  const label = `${language}${format === 'landscape' ? '' : `.${format}`}`;
  const directory = join(ROOT, 'tmp/promo', `${name}.${label}`);
  mkdirSync(directory, { recursive: true });

  const captionLog = new Set<string>();
  const recordings: Recording[] = [];
  // A scene that goes on from the previous one starts from its end state and depends on its hash: a change in a scene films it and the ones after it again, not the ones before.
  let previous: { hash: string; endState: string } | undefined;
  for (const scene of scenes) {
    const goesOn = scene.options.from === 'previous';
    if (goesOn && !previous) throw new Error(`The scene ${scene.name} goes on from a previous scene, and there is none`);
    const hash = sceneHash(scene, ROOT, goesOn ? previous!.hash : undefined);
    const video = join(directory, `${scene.name}.${hash}.webm`);
    let recording: Recording;
    // With `--scene`, `--fresh` films that scene again and takes the ones before it from the cache.
    const refilm = fresh && (!only || only === scene.name);
    if (!fast && !refilm && existsSync(video) && existsSync(`${video}.state.json`)) {
      console.log(`[${label}] ${scene.name}: cached`);
      recording = { video, cues: [], viewport: scene.options.viewport ?? DEFAULT_VIEWPORT, ...JSON.parse(readFileSync(`${video}.json`, 'utf8')), endState: readFileSync(`${video}.state.json`, 'utf8') };
    } else {
      console.log(`[${label}] ${scene.name}: recording`);
      recording = await recordScene(scene, { baseUrl: BASE_URL, root: ROOT, directory, hash, fast, startState: goesOn ? previous!.endState : undefined, captionLog });
    }
    previous = { hash, endState: recording.endState };
    recordings.push(recording);
    if (only === scene.name) break;
  }

  if (only || fast) return;
  await makeVoices(recordings, label);
  const output = join(ROOT, 'tmp/promo', `${name}.${label}.mp4`);
  assemble(recordings, output, directory, { ...loaded, audio: music ? resolve(ROOT, music) : undefined });
  console.log(output);
}

for (const job of jobs) await film(job);
