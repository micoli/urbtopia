import { CODEX_ENTRIES, CODEX_SECTIONS } from '../codex/catalog';
import { t } from '../i18n/t';
import { firstImageOf, type GuideData } from './guideData';
import { codexSectionPathOf, gameRootOf, hrefOf, type GuideRoute } from './routes';

interface CodexIndexPageProps {
  route: GuideRoute;
  data: GuideData;
}

export function CodexIndexPage({ route, data }: CodexIndexPageProps) {
  return (
    <article>
      <h1>{t('guide.codex')}</h1>
      <p className="max-w-3xl text-lg text-muted">{t('guide.codexIntro')}</p>
      <ul className="guide-tiles">
        {CODEX_SECTIONS.map(section => {
          const entries = CODEX_ENTRIES.filter(entry => entry.section === section);
          const first = entries[0];
          return (
            <li key={section}>
              <a className="guide-tile" href={hrefOf(route, codexSectionPathOf(route.language, section))}>
                {first
                  ? <img className="aspect-square w-full" src={`${gameRootOf(route)}codex/${data.images[firstImageOf(first)]}`} width={512} height={512} alt="" loading="lazy" />
                  : <span className="aspect-square w-full" />}
                <span className="font-semibold">{t(section)}</span>
                <span className="text-xs text-muted">{t('guide.entryCount').replace('{count}', String(entries.length))}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </article>
  );
}
