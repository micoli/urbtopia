import { useState } from 'react';

const STORAGE_KEY = 'urbix.buildingSearch.expanded';

function readExpanded(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === 'string') : []);
  } catch {
    return new Set();
  }
}

function writeExpanded(expanded: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...expanded]));
  } catch {
    // storage unavailable: the tree state just is not remembered
  }
}

export function useExpandedBranches() {
  const [expanded, setExpanded] = useState(readExpanded);
  const toggle = (branch: string) => {
    const next = new Set(expanded);
    if (!next.delete(branch)) next.add(branch);
    writeExpanded(next);
    setExpanded(next);
  };
  return { expanded, toggle };
}
