export const noise = (seed: number, step: number, salt: number): number => {
  const value = Math.sin(seed * 0.001 + step * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
};

export const clamp = (value: number, low: number, high: number): number => Math.min(high, Math.max(low, value));
