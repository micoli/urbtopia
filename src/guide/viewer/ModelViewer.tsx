import { useEffect, useRef, useState } from 'react';
import type { CodexId } from '../../codex/catalog';
import type { ColorVariant } from '../../core';
import { t } from '../../i18n/t';
import type { Turntable } from './turntable';

interface ModelViewerProps {
  modelsUrl: string;
  id: CodexId;
  level: number;
  colorVariant: ColorVariant | undefined;
  fallback: string;
}

export function ModelViewer({ modelsUrl, id, level, colorVariant, fallback }: ModelViewerProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [turntable, setTurntable] = useState<Turntable | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let created: Turntable | null = null;
    let active = true;
    import('./turntable').then(({ createTurntable }) => {
      if (!active) return;
      created = createTurntable(canvas.current!, modelsUrl);
      setTurntable(created);
    }).catch(() => setFailed(true));
    return () => {
      active = false;
      created?.dispose();
    };
  }, [modelsUrl]);

  useEffect(() => {
    if (!turntable) return;
    setLoading(true);
    turntable.show(id, level, colorVariant).then(() => setLoading(false), () => setFailed(true));
  }, [turntable, id, level, colorVariant]);

  if (failed) return (
    <>
      <img className="mx-auto aspect-square w-full max-w-md" src={fallback} width={512} height={512} alt="" />
      <p role="alert" className="text-center text-sm text-muted">{t('guide.viewer3dFailed')}</p>
    </>
  );
  return (
    <div className="relative mx-auto aspect-square w-full max-w-md">
      <canvas ref={canvas} className="size-full cursor-grab touch-none active:cursor-grabbing" aria-label={t('guide.viewer3d')} />
      {loading && <p className="absolute inset-0 m-0 flex items-center justify-center text-sm text-muted">{t('guide.viewer3dLoading')}</p>}
    </div>
  );
}
