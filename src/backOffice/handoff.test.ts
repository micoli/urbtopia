import { describe, expect, it } from 'vitest';
import { isBackOfficeSessionRequested, readSaveMessage, SAVE_MESSAGE } from './handoff';

const ORIGIN = 'http://localhost:5180';
const message = { type: SAVE_MESSAGE, handle: 'ada', revision: 3, envelope: '{}' };

describe('isBackOfficeSessionRequested', () => {
  it('is on only in dev with the from-back-office parameter', () => {
    expect(isBackOfficeSessionRequested('?bypass-tutorial&from-back-office', true)).toBe(true);
    expect(isBackOfficeSessionRequested('?from-back-office', false)).toBe(false);
    expect(isBackOfficeSessionRequested('?bypass-tutorial', true)).toBe(false);
  });
});

describe('readSaveMessage', () => {
  it('accepts a save message from the Back office origin', () => {
    expect(readSaveMessage(ORIGIN, message)).toEqual({ handle: 'ada', revision: 3, envelope: '{}' });
    expect(readSaveMessage('http://127.0.0.1:5180', message)).not.toBeNull();
  });

  it('keeps a missing handle as null', () => {
    expect(readSaveMessage(ORIGIN, { ...message, handle: undefined })?.handle).toBeNull();
  });

  it('refuses any other origin', () => {
    expect(readSaveMessage('https://evil.example', message)).toBeNull();
    expect(readSaveMessage('http://localhost:5173', message)).toBeNull();
  });

  it('refuses malformed messages', () => {
    expect(readSaveMessage(ORIGIN, null)).toBeNull();
    expect(readSaveMessage(ORIGIN, 'save')).toBeNull();
    expect(readSaveMessage(ORIGIN, { ...message, type: 'other' })).toBeNull();
    expect(readSaveMessage(ORIGIN, { ...message, envelope: 12 })).toBeNull();
    expect(readSaveMessage(ORIGIN, { ...message, revision: 1.5 })).toBeNull();
  });
});
