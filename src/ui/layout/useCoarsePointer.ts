import { useEffect, useState } from 'react';

export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(() => window.matchMedia('(pointer: coarse)').matches);
  useEffect(() => {
    const media = window.matchMedia('(pointer: coarse)');
    const update = () => setCoarse(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  return coarse;
}
