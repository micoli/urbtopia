export interface CameraView {
  x: number;
  z: number;
  zoom: number;
}

const PRECISION = 100;

export function readCameraView(search: string): Partial<CameraView> {
  const params = new URLSearchParams(search);
  const view: Partial<CameraView> = {};
  for (const key of ['x', 'z', 'zoom'] as const) {
    const raw = params.get(key);
    const value = raw === null || raw.trim() === '' ? NaN : Number(raw);
    if (Number.isFinite(value)) view[key] = value;
  }
  return view;
}

export function writeCameraView(search: string, view: CameraView): string {
  const params = new URLSearchParams(search);
  params.set('x', String(round(view.x)));
  params.set('z', String(round(view.z)));
  params.set('zoom', String(round(view.zoom)));
  return `?${params.toString()}`;
}

function round(value: number): number {
  return Math.round(value * PRECISION) / PRECISION;
}
