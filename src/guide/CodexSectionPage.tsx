import { CODEX_ENTRIES, type CodexSection } from '../codex/catalog';
import { t } from '../i18n/t';
import { CodexEntryCard } from './CodexEntryCard';
import type { GuideData } from './guideData';
import { RelatedRules } from './RelatedRules';
import type { GuideRoute } from './routes';

interface CodexSectionPageProps {
  route: GuideRoute;
  section: CodexSection;
  data: GuideData;
}

export function CodexSectionPage({ route, section, data }: CodexSectionPageProps) {
  const entries = CODEX_ENTRIES.filter(entry => entry.section === section);
  return (
    <article>
      <p className="guide-eyebrow">{t('guide.codex')}</p>
      <h1>{t(section)}</h1>
      <ul className="guide-tiles">
        {entries.map(entry => <li key={entry.id}><CodexEntryCard route={route} entry={entry} data={data} /></li>)}
      </ul>
      <RelatedRules route={route} section={section} />
    </article>
  );
}
