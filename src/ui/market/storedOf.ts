import type { Storage } from '../../core';

export const storedOf = (storage: Storage, item: string): number => (storage.materials as Record<string, number | undefined>)[item] ?? (storage.goods as Record<string, number | undefined>)[item] ?? 0;
