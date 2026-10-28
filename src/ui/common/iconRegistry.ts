import {
  ArrowDown, ArrowUp, Check, ChevronDown, ChevronRight, Lock, Menu, Move, RotateCcw, RotateCw, Trash2, Undo2, X,
  type LucideIcon,
} from 'lucide-react';

export const ICONS = {
  rotateLeft: RotateCcw,
  rotateRight: RotateCw,
  move: Move,
  close: X,
  trash: Trash2,
  undo: Undo2,
  check: Check,
  lock: Lock,
  menu: Menu,
  arrowUp: ArrowUp,
  arrowDown: ArrowDown,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
} as const satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;
