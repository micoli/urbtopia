export interface InlineSegment {
  kind: 'text' | 'bold' | 'italic' | 'code';
  text: string;
}

const TOKEN = /(\*\*[^*]+\*\*|\*(?!\s)[^*]+?(?<!\s)\*|`[^`]+`)/;

// Only what a release note uses: **bold**, *italic* and `code`. Anything else stays plain text.
export function parseInlineMarkdown(text: string): InlineSegment[] {
  return text
    .split(TOKEN)
    .filter(part => part !== '')
    .map((part): InlineSegment => {
      if (part.startsWith('**') && part.endsWith('**') && part.length > 4) return { kind: 'bold', text: part.slice(2, -2) };
      if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return { kind: 'italic', text: part.slice(1, -1) };
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) return { kind: 'code', text: part.slice(1, -1) };
      return { kind: 'text', text: part };
    });
}
