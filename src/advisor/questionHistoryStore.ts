import { createStore } from 'zustand/vanilla';
import { MAX_QUESTION_LENGTH } from './advisorRequest';

export const QUESTION_HISTORY_KEY = 'urbtopia-advisor-questions';
export const MAX_HISTORY = 10;

export function parseHistory(raw: string | null): string[] {
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim() !== '').slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function withQuestion(history: readonly string[], question: string): string[] {
  const trimmed = question.trim().slice(0, MAX_QUESTION_LENGTH);
  if (trimmed === '') return [...history];
  return [trimmed, ...history.filter((item) => item !== trimmed)].slice(0, MAX_HISTORY);
}

function readStored(): string | null {
  try {
    return localStorage.getItem(QUESTION_HISTORY_KEY);
  } catch {
    return null;
  }
}

function writeStored(history: readonly string[]): void {
  try {
    localStorage.setItem(QUESTION_HISTORY_KEY, JSON.stringify(history));
  } catch {
    // The history is a convenience: the Advisor works without storing it.
  }
}

export interface QuestionHistoryStore {
  questions: readonly string[];
  record: (question: string) => void;
  clear: () => void;
}

// Questions only, kept in this browser: answers are never stored, and the history is not part of saves, exports or Cloud sync.
export const questionHistoryStore = createStore<QuestionHistoryStore>((set, get) => ({
  questions: parseHistory(readStored()),
  record: (question) => {
    const questions = withQuestion(get().questions, question);
    set({ questions });
    writeStored(questions);
  },
  clear: () => {
    set({ questions: [] });
    writeStored([]);
  },
}));
