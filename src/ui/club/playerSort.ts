import { useState } from 'react';
import type { Player } from '../../core';

export type PlayerSortKey = 'name' | 'position' | 'rating' | 'form' | 'age' | 'wage';
export interface PlayerSort {
  key: PlayerSortKey;
  descending: boolean;
}

const VALUES: Record<PlayerSortKey, (player: Player) => string | number> = {
  name: player => player.name,
  position: player => player.position,
  rating: player => player.rating,
  form: player => player.form,
  age: player => player.age,
  wage: player => player.contract.wage,
};

export function sortPlayers(players: readonly Player[], sort: PlayerSort | null): Player[] {
  if (!sort) return [...players];
  const value = VALUES[sort.key];
  const direction = sort.descending ? -1 : 1;
  return [...players].sort((a, b) => {
    const left = value(a);
    const right = value(b);
    const order = typeof left === 'string' ? left.localeCompare(right as string) : left - (right as number);
    return order * direction || a.id - b.id;
  });
}

// Numeric columns start with the biggest value, text columns alphabetically.
export function nextSort(current: PlayerSort | null, key: PlayerSortKey): PlayerSort {
  if (current?.key === key) return { key, descending: !current.descending };
  return { key, descending: key !== 'name' && key !== 'position' };
}

export function usePlayerSort(initial: PlayerSort | null) {
  const [sort, setSort] = useState<PlayerSort | null>(initial);
  return { sort, onSort: (key: PlayerSortKey) => setSort(current => nextSort(current, key)) };
}
