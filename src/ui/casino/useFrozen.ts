import { useEffect, useState } from 'react';

export function useFrozen<T>(value: T, frozen: boolean): T {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (!frozen) setShown(value);
  }, [value, frozen]);
  return shown;
}
