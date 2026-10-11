import { useEffect, useState } from 'react';
import { modelThumbnail } from './modelThumbnail';
import type { Offset } from './radialLayout';

export function ItemThumbnail({ model, offset }: { model: string; offset: Offset }) {
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
  return <img className="collect-badge-preview" src={source} alt="" draggable={false} style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }} />;
}
