import { describe, expect, it } from 'vitest';
import { isBugReportShortcut } from './isBugReportShortcut';

const keys = (patch: Partial<Parameters<typeof isBugReportShortcut>[0]>) => ({ altKey: true, shiftKey: true, ctrlKey: false, metaKey: false, code: 'KeyB', ...patch });

describe('isBugReportShortcut', () => {
  it('is Alt+Shift+B', () => {
    expect(isBugReportShortcut(keys({}))).toBe(true);
  });

  it('ignores other combinations', () => {
    expect(isBugReportShortcut(keys({ altKey: false }))).toBe(false);
    expect(isBugReportShortcut(keys({ shiftKey: false }))).toBe(false);
    expect(isBugReportShortcut(keys({ ctrlKey: true }))).toBe(false);
    expect(isBugReportShortcut(keys({ code: 'KeyV' }))).toBe(false);
  });
});
