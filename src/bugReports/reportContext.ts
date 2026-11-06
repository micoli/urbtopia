export interface ReportEnvironment {
  version: string;
  buildId: string;
  userAgent: string;
  language: string;
  screen: { width: number; height: number; pixelRatio: number };
  gpu: string | null;
  errors: string[];
}

export function describeEnvironment(env: ReportEnvironment): Record<string, unknown> {
  return { ...env };
}

export function readGpuName(canvas: HTMLCanvasElement = document.createElement('canvas')): string | null {
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  if (!gl) return null;
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  if (!info) return null;
  const name = gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
  return typeof name === 'string' ? name : null;
}
