import { SCREENSHOT_MAX_CHARS, SCREENSHOT_MAX_WIDTH, SCREENSHOT_QUALITY } from './limits';
import { fitWithin } from './imageSizing';

const QUALITY_STEP = 0.15;
const MIN_QUALITY = 0.3;
const SHRINK = 0.75;

// A data URL (WebP where the browser can encode it, JPEG otherwise) that fits the size limit, or null when nothing small enough exists.
export function encodeCanvas(source: HTMLCanvasElement): string | null {
  let width = Math.min(source.width, SCREENSHOT_MAX_WIDTH);
  while (width >= 320) {
    const target = drawScaled(source, width);
    for (let quality = SCREENSHOT_QUALITY; quality >= MIN_QUALITY; quality -= QUALITY_STEP) {
      const url = encodeOnce(target, quality);
      if (url.length <= SCREENSHOT_MAX_CHARS) return url;
    }
    width = Math.floor(width * SHRINK);
  }
  return null;
}

function drawScaled(source: HTMLCanvasElement, maxWidth: number): HTMLCanvasElement {
  const size = fitWithin(source.width, source.height, maxWidth);
  const target = document.createElement('canvas');
  target.width = size.width;
  target.height = size.height;
  target.getContext('2d')?.drawImage(source, 0, 0, size.width, size.height);
  return target;
}

function encodeOnce(canvas: HTMLCanvasElement, quality: number): string {
  const webp = canvas.toDataURL('image/webp', quality);
  return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', quality);
}
