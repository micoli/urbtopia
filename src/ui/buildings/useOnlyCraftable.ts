import { useState } from 'react';

const STORAGE_KEY = 'urbtopia-only-craftable';

function readOnlyCraftable(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function writeOnlyCraftable(value: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(value));
  } catch {
    // storage unavailable: the choice just is not remembered
  }
}

export function useOnlyCraftable(): [boolean, (value: boolean) => void] {
  const [onlyCraftable, setOnlyCraftable] = useState(readOnlyCraftable);
  const update = (value: boolean) => {
    writeOnlyCraftable(value);
    setOnlyCraftable(value);
  };
  return [onlyCraftable, update];
}
