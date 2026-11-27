import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Recording } from './record.ts';
import { DEFAULT_VIEWPORT } from './types.ts';

const ffmpeg = (...args: string[]): void => void execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });

function normalise(recording: Recording): string {
  const output = recording.video.replace(/\.webm$/, '.mp4');
  ffmpeg('-ss', String(recording.trimSeconds), '-i', recording.video, '-vf', `scale=${DEFAULT_VIEWPORT.width}:${DEFAULT_VIEWPORT.height}:flags=lanczos,fps=30`, '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-an', output);
  return output;
}

export function assemble(recordings: Recording[], output: string, directory: string, audio?: string): void {
  const parts = recordings.map(normalise);
  const list = join(directory, 'concat.txt');
  writeFileSync(list, parts.map((part) => `file '${part}'`).join('\n'));
  if (!audio) return ffmpeg('-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', output);
  ffmpeg('-f', 'concat', '-safe', '0', '-i', list, '-i', audio, '-c:v', 'copy', '-c:a', 'aac', '-shortest', output);
}
