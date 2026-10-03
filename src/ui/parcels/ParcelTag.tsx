import { useEffect, useRef } from 'react';
import { GAME_CONFIG } from '../../core';
import { sceneHandle } from '../../store/sceneHandle';

interface ParcelTagProps {
  parcelX: number;
  parcelY: number;
  price: number;
}

export function ParcelTag({ parcelX, parcelY, price }: ParcelTagProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const size = GAME_CONFIG.parcelSizeInTiles;
    let handle = 0;
    const place = () => {
      const projected = sceneHandle.current?.project(parcelX * size + size / 2, 0.5, parcelY * size + size / 2);
      if (ref.current && projected) {
        ref.current.style.transform = `translate(${projected.x}px, ${projected.y}px) translate(-50%, -50%)`;
        ref.current.style.visibility = projected.visible ? 'visible' : 'hidden';
      }
      handle = requestAnimationFrame(place);
    };
    handle = requestAnimationFrame(place);
    return () => cancelAnimationFrame(handle);
  }, [parcelX, parcelY]);

  return (
    <div ref={ref} className="parcel-tag">
      {price}
    </div>
  );
}
