import { useEffect, useState } from 'react';
import { modelThumbnail } from './modelThumbnail';
import type { Offset } from './radialLayout';

export function ItemThumbnail({ model, offset, size }: { model: string; offset: Offset; size: number }) {
  const [source, setSource] = useState<string | null>(null);

  useEffect(() => {
    let current = true;
    void modelThumbnail(model).then((url) => {
      if (current) setSource(url);
    });
    return () => {
      current = false;
    };
  }, [model]);

  if (!source) return null;
  return <img className="collect-badge-preview" src={source} alt="" draggable={false} style={{ width: size, height: size, left: `calc(50% - ${size / 2}px)`, top: `calc(50% - ${size / 2}px)`, transform: `translate(${offset.x}px, ${offset.y}px)` }} />;
}
