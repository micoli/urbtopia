import { describe, expect, it } from 'vitest';
import { parseInlineMarkdown } from './inlineMarkdown';

describe('parseInlineMarkdown', () => {
  it('keeps plain text as it is', () => {
    expect(parseInlineMarkdown('🏗️ Build a Library')).toEqual([{ kind: 'text', text: '🏗️ Build a Library' }]);
  });

  it('reads bold, italic and code', () => {
    expect(parseInlineMarkdown('🚀 A **new** *fast* `Ctrl+Z` key')).toEqual([
      { kind: 'text', text: '🚀 A ' },
      { kind: 'bold', text: 'new' },
      { kind: 'text', text: ' ' },
      { kind: 'italic', text: 'fast' },
      { kind: 'text', text: ' ' },
      { kind: 'code', text: 'Ctrl+Z' },
      { kind: 'text', text: ' key' },
    ]);
  });

  it('leaves a lone star or an empty mark as text', () => {
    expect(parseInlineMarkdown('5 * 3 and ****')).toEqual([{ kind: 'text', text: '5 * 3 and ****' }]);
  });
});
