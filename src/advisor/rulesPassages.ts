export interface RulesPassage {
  title: string;
  text: string;
}

const META_BLOCK = /^export const meta = \{[\s\S]*?\n\};?\n/m;
const META_TITLE = /title:\s*'((?:[^'\\]|\\.)*)'/;
const ENTRY_LINK = /<EntryLink id="([^"]+)"\s*\/>/g;
const SELF_CLOSING_COMPONENT = /<[A-Z]\w*[^>]*\/>/g;
const COMPONENT_TAG = /<\/?[A-Z]\w*[^>]*>/g;

export function passagesFromArticle(source: string, nameOfEntry: (id: string) => string): RulesPassage[] {
  const articleTitle = META_TITLE.exec(source)?.[1]?.replaceAll("\\'", "'") ?? '';
  const body = source
    .replace(META_BLOCK, '')
    .replace(ENTRY_LINK, (_, id: string) => nameOfEntry(id))
    .replace(SELF_CLOSING_COMPONENT, '')
    .replace(COMPONENT_TAG, '')
    .replaceAll('**', '')
    .replace(/^\|?[ \t]*-{3,}[ \t|-]*$/gm, '')
    .replace(/[ \t]*\|[ \t]*/g, ' ; ')
    .replace(/^ ; /gm, '- ');
  const [preamble = '', ...sections] = body.split(/^## /m);
  const compact = (text: string) => text.replace(/\n{2,}/g, '\n').trim();
  const passages = sections.map((section) => {
    const [heading = '', ...lines] = section.split('\n');
    return { title: `${articleTitle} - ${heading.trim()}`, text: compact(lines.join('\n')) };
  });
  return [{ title: articleTitle, text: compact(preamble) }, ...passages].filter((passage) => passage.text !== '');
}
