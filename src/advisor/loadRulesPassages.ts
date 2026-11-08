import { CODEX_ENTRIES } from '../codex/catalog';
import type { MessageKey } from '../i18n/messages';
import type { Language } from '../i18n/prefsStore';
import { messageIn } from './messageIn';
import { passagesFromArticle, type RulesPassage } from './rulesPassages';
import { isAboutCity, selectPassages } from './selectPassages';

const articleSources = import.meta.glob<string>('../guide/content/*/*.mdx', { query: '?raw', import: 'default' });

const loaded = new Map<Language, Promise<RulesPassage[]>>();

function codexPassages(language: Language): RulesPassage[] {
  return CODEX_ENTRIES.flatMap((entry) => {
    const text = messageIn(language, entry.description as MessageKey);
    return text.includes('{') ? [] : [{ title: messageIn(language, entry.name as MessageKey), text }];
  });
}

async function loadPassages(language: Language): Promise<RulesPassage[]> {
  const nameOfEntry = (id: string) => CODEX_ENTRIES.find((entry) => entry.id === id)?.name;
  const nameIn = (id: string) => {
    const name = nameOfEntry(id);
    return name === undefined ? id : messageIn(language, name);
  };
  const files = Object.entries(articleSources).filter(([path]) => path.endsWith(`.${language}.mdx`));
  const articles = await Promise.all(files.map(async ([, load]) => passagesFromArticle(await load(), nameIn)));
  return [...articles.flat(), ...codexPassages(language)];
}

function rulesPassages(language: Language): Promise<RulesPassage[]> {
  const pending = loaded.get(language) ?? loadPassages(language);
  loaded.set(language, pending);
  pending.catch(() => loaded.delete(language));
  return pending;
}

export interface RulesContext {
  passages: readonly RulesPassage[];
  aboutCity: boolean;
}

export async function rulesContextFor(question: string, language: Language): Promise<RulesContext> {
  const passages = selectPassages(await rulesPassages(language), question);
  return { passages, aboutCity: isAboutCity(question) };
}
