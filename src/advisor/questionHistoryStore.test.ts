import { beforeEach, describe, expect, it } from 'vitest';
import { MAX_HISTORY, parseHistory, questionHistoryStore, withQuestion } from './questionHistoryStore';

describe('withQuestion', () => {
  it('puts the newest question first and moves a repeated one to the top', () => {
    expect(withQuestion(['b', 'a'], 'c')).toEqual(['c', 'b', 'a']);
    expect(withQuestion(['b', 'a'], 'a')).toEqual(['a', 'b']);
  });

  it('keeps only the last 10 and ignores blank questions', () => {
    const full = Array.from({ length: MAX_HISTORY }, (_, index) => `q${index}`);
    expect(withQuestion(full, 'new')).toHaveLength(MAX_HISTORY);
    expect(withQuestion(full, 'new')[0]).toBe('new');
    expect(withQuestion(full, 'new')).not.toContain('q9');
    expect(withQuestion(['a'], '   ')).toEqual(['a']);
  });
});

describe('parseHistory', () => {
  it('falls back to an empty list on bad storage', () => {
    expect(parseHistory(null)).toEqual([]);
    expect(parseHistory('not json')).toEqual([]);
    expect(parseHistory('{"a":1}')).toEqual([]);
  });

  it('keeps strings only, at most 10', () => {
    expect(parseHistory(JSON.stringify(['a', 3, '', 'b']))).toEqual(['a', 'b']);
    expect(parseHistory(JSON.stringify(Array.from({ length: 15 }, (_, index) => `q${index}`)))).toHaveLength(MAX_HISTORY);
  });
});

describe('questionHistoryStore', () => {
  beforeEach(() => questionHistoryStore.getState().clear());

  it('records and clears', () => {
    questionHistoryStore.getState().record('Why?');
    expect(questionHistoryStore.getState().questions).toEqual(['Why?']);
    questionHistoryStore.getState().clear();
    expect(questionHistoryStore.getState().questions).toEqual([]);
  });
});
