import { execFileSync } from 'node:child_process';
import { existsSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Recording } from './record.ts';
import type { ScenarioOptions } from './types.ts';

const FADE_SECONDS = 0.35;
const MUSIC_VOLUME = 0.16;
const MUSIC_FADE_IN_SECONDS = 1.2;
const MUSIC_FADE_OUT_SECONDS = 3;

const ffmpeg = (...args: string[]): void => void execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
const durationOf = (file: string): number => Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString());

// One scene: its picture, the voice lines at their moments over a silent base, and a fade in and out when the scenes are joined through black.
function normalise(recording: Recording, fade: boolean): string {
  const output = recording.video.replace(/\.webm$/, '.mp4');
  // A scene already encoded since it was filmed is not encoded again: its name holds the hash of what it is made of.
  if (existsSync(output) && statSync(output).mtimeMs >= statSync(recording.video).mtimeMs) return output;
  const seconds = durationOf(recording.video) - recording.trimSeconds;
  const fadeOut = Math.max(0, seconds - FADE_SECONDS);
  const picture = `scale=${recording.viewport.width}:${recording.viewport.height}:flags=lanczos,fps=30${fade ? `,fade=t=in:st=0:d=${FADE_SECONDS},fade=t=out:st=${fadeOut}:d=${FADE_SECONDS}` : ''}`;
  const lines = recording.cues.map((cue, index) => `[${index + 2}:a]adelay=${Math.max(0, Math.round((cue.at - recording.trimSeconds) * 1000))}:all=1,aresample=48000[c${index}]`);
  const mixed = ['[1:a]', ...recording.cues.map((_, index) => `[c${index}]`)].join('');
  const sound = `${lines.join(';')}${lines.length ? ';' : ''}${mixed}amix=inputs=${recording.cues.length + 1}:duration=first:normalize=0${fade ? `,afade=t=in:st=0:d=${FADE_SECONDS},afade=t=out:st=${fadeOut}:d=${FADE_SECONDS}` : ''}[a]`;
  ffmpeg(
    '-ss', String(recording.trimSeconds), '-i', recording.video,
    '-f', 'lavfi', '-t', String(seconds), '-i', 'anullsrc=r=48000:cl=stereo',
    ...recording.cues.flatMap((cue) => ['-i', cue.file]),
    '-filter_complex', `[0:v]${picture}[v];${sound}`,
    '-map', '[v]', '-map', '[a]', '-t', String(seconds),
    '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', output,
  );
  return output;
}

export function assemble(recordings: Recording[], output: string, directory: string, { audio, transition = 'fade' }: ScenarioOptions = {}): void {
  const parts = recordings.map((recording) => normalise(recording, transition === 'fade'));
  const list = join(directory, 'concat.txt');
  writeFileSync(list, parts.map((part) => `file '${part}'`).join('\n'));
  if (!audio) return ffmpeg('-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', output);
  const total = parts.reduce((sum, part) => sum + durationOf(part), 0);
  const music = `[1:a]atrim=0:${total},volume=${MUSIC_VOLUME},afade=t=in:d=${MUSIC_FADE_IN_SECONDS},afade=t=out:st=${Math.max(0, total - MUSIC_FADE_OUT_SECONDS)}:d=${MUSIC_FADE_OUT_SECONDS}[m]`;
  ffmpeg('-f', 'concat', '-safe', '0', '-i', list, '-stream_loop', '-1', '-i', audio, '-filter_complex', `${music};[0:a][m]amix=inputs=2:duration=first:normalize=0[a]`, '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', output);
}
