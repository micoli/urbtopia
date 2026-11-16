import { useState } from 'react';

export const DEMONSTRATION_SPEED_KEY = 'urbtopia-demonstration-speed';

export const DEMONSTRATION_SPEEDS = [0.5, 1, 1.5, 2, 2.5] as const;
const DEFAULT_SPEED = 1;

export function readDemonstrationSpeed(): number {
  try {
    const stored = Number(localStorage.getItem(DEMONSTRATION_SPEED_KEY));
    return DEMONSTRATION_SPEEDS.find(speed => speed === stored) ?? DEFAULT_SPEED;
  } catch {
    return DEFAULT_SPEED;
  }
}

export function writeDemonstrationSpeed(speed: number): void {
  try {
    localStorage.setItem(DEMONSTRATION_SPEED_KEY, String(speed));
  } catch {
    // storage unavailable: the choice just is not remembered
  }
}

export function useDemonstrationSpeed(): [number, (speed: number) => void] {
  const [speed, setSpeed] = useState(readDemonstrationSpeed);
  const update = (value: number) => {
    writeDemonstrationSpeed(value);
    setSpeed(value);
  };
  return [speed, update];
}
