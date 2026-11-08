import { parseInlineMarkdown } from '../../releaseNotes/inlineMarkdown';

interface InlineMarkdownProps {
  text: string;
}

export function InlineMarkdown({ text }: InlineMarkdownProps) {
  return (
    <>
      {parseInlineMarkdown(text).map((segment, index) => {
        if (segment.kind === 'bold') return <strong key={index}>{segment.text}</strong>;
        if (segment.kind === 'italic') return <em key={index}>{segment.text}</em>;
        if (segment.kind === 'code') return <code key={index}>{segment.text}</code>;
        return segment.text;
      })}
    </>
  );
}
