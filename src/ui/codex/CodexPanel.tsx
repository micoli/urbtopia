import { useEffect, useId, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { CODEX_ENTRIES, CODEX_SECTIONS, type CodexId } from '../../codex/catalog';
import { favoriteKeyOf, favoriteTargetOf, type FavoriteTarget } from '../../codex/favorites';
import { matchesSearch } from '../../codex/matchesSearch';
import { CODEX_PAGES, type CodexPage } from '../../codex/pages';
import { ARTICLES, translationOf, type Article } from '../../guide/content/articles';
import type { ArticleLinker } from '../../guide/content/articleLinker';
import { articleOfRules, isRulesWrittenUp } from '../../guide/routes';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { useUi } from '../common/hooks';
import { useBackdropClose } from '../common/useBackdropClose';
import { navButtonAt } from './navButtonAt';
import { CodexEntryContent } from './CodexEntryContent';
import { CodexArticle } from './CodexArticle';
import { ARTICLE_GROUPS, CodexArticleNav } from './CodexArticleNav';
import { CodexFavoriteButton } from './CodexFavoriteButton';
import { CodexFavoritesNav } from './CodexFavoritesNav';
import { CodexGuideLink } from './CodexGuideLink';
import { CODEX_PAGE_COMPONENTS } from './codexPageComponents';
import { useCodexManifest } from './useCodexManifest';
import { CloseButton } from '../common/CloseButton';
import { ActionButton } from '../common/ActionButton';
import { AccordionSection } from '../common/AccordionSection';
import { SearchField } from '../common/SearchField';

const groupTitleOf = ({ section }: Article): string => ARTICLE_GROUPS.find(group => group.id === section)!.title;

export function CodexPanel() {
  const close = useUi(store => store.closeCodex);
  const backdrop = useBackdropClose(event => {
    close();
    const nav = navButtonAt(event.clientX, event.clientY);
    if (nav && nav.dataset.action !== 'codex') nav.click();
  });
  const initialEntry = useUi(store => store.codexEntryId);
  const initialDetail = useUi(store => store.codexShowDetail);
  const initialPage = useUi(store => store.codexPage);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const initialArticle = initialPage ? articleOfRules(initialPage) ?? null : null;
  const language = prefsStore.getState().language;
  const [selected, setSelected] = useState<CodexId>(initialEntry);
  const [showDetail, setShowDetail] = useState(initialDetail);
  const [page, setPage] = useState<CodexPage | null>(initialArticle ? null : initialPage);
  const [article, setArticle] = useState<Article | null>(initialArticle);
  const [search, setSearch] = useState('');
  const searching = search.trim() !== '';
  const pageOpen = page !== null || article !== null;
  const [openSection, setOpenSection] = useState<string>(initialArticle ? groupTitleOf(initialArticle) : CODEX_PAGES.find(item => item.id === initialPage)?.section ?? CODEX_ENTRIES.find(entry => entry.id === initialEntry)!.section);
  const [favoritesOpen, setFavoritesOpen] = useState(true);
  const favoriteKeys = useStore(prefsStore, store => store.codexFavorites);
  const { manifest, failed, retry } = useCodexManifest();
  const entry = CODEX_ENTRIES.find(entry => entry.id === selected)!;
  const detail = useRef<HTMLElement>(null);
  const filteredEntries = CODEX_ENTRIES.filter(item => matchesSearch(`${t(item.name)} ${t(item.description)} ${t(item.section)}`, search));
  const filteredPages = CODEX_PAGES.filter(item => !isRulesWrittenUp(item.id) && matchesSearch(`${t(item.title)} ${t(item.description)} ${t(item.section)}`, search));
  const filteredArticles = ARTICLES.filter(item => matchesSearch(`${translationOf(item, language).meta.title} ${translationOf(item, language).meta.summary}`, search));
  const hasResults = !searching || filteredEntries.length > 0 || filteredPages.length > 0 || filteredArticles.length > 0;
  const labelOfFavorite = (target: FavoriteTarget): string => {
    if (target.kind === 'article') return translationOf(target.article, language).meta.title;
    if (target.kind === 'page') return t(CODEX_PAGES.find(item => item.id === target.id)!.title);
    return t(CODEX_ENTRIES.find(item => item.id === target.id)!.name);
  };
  const currentTarget: FavoriteTarget = article ? { kind: 'article', article } : page ? { kind: 'page', id: page } : { kind: 'entry', id: selected };
  const favorites = favoriteKeys
    .flatMap(key => favoriteTargetOf(key, ARTICLES) ?? [])
    .map(target => ({ target, label: labelOfFavorite(target), current: favoriteKeyOf(target) === favoriteKeyOf(currentTarget) }))
    .filter(({ label }) => matchesSearch(label, search));
  const Page = page ? CODEX_PAGE_COMPONENTS[page] : null;
  const pageTitle = article ? translationOf(article, language).meta.title : page ? t(CODEX_PAGES.find(item => item.id === page)!.title) : t(entry.name);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousEntry = previous?.getAttribute('data-codex-id') ?? previous?.getAttribute('data-codex-label');
    dialog.current?.showModal();
    return () => {
      requestAnimationFrame(() => {
        if (previous?.isConnected && previous !== document.body) return previous.focus();
        if (previousEntry) {
          const trigger = [...document.querySelectorAll<HTMLButtonElement>('[data-codex-label], [data-codex-id]')].find(button => (button.dataset.codexLabel ?? button.dataset.codexId) === previousEntry);
          if (trigger) return trigger.focus();
        }
        const target = document.querySelector<HTMLButtonElement>('.side-panel-actions [data-action="codex"]')
          ?? document.querySelector<HTMLButtonElement>('[data-action="codex"]')
          ?? document.querySelector<HTMLButtonElement>('.radial-fab');
        target?.focus();
      });
    };
  }, []);

  useEffect(() => {
    if (!showDetail) return;
    detail.current?.scrollTo(0, 0);
    detail.current?.focus();
  }, [selected, showDetail, page]);

  const select = (id: CodexId) => {
    setPage(null);
    setArticle(null);
    setSelected(id);
    setOpenSection(CODEX_ENTRIES.find(entry => entry.id === id)!.section);
    setShowDetail(true);
  };

  const openArticle = (target: Article) => {
    setPage(null);
    setArticle(target);
    setOpenSection(groupTitleOf(target));
    setShowDetail(true);
  };

  const openPage = (id: CodexPage) => {
    const written = articleOfRules(id);
    if (written) return openArticle(written);
    setArticle(null);
    setPage(id);
    setShowDetail(true);
  };

  const openFavorite = (target: FavoriteTarget) => {
    if (target.kind === 'article') return openArticle(target.article);
    if (target.kind === 'page') return openPage(target.id);
    select(target.id);
  };

  const linker: ArticleLinker = {
    language,
    entry: id => ({ href: '#', onClick: event => { event.preventDefault(); select(id); } }),
    rules: id => ({ href: '#', onClick: event => { event.preventDefault(); openPage(id); } }),
    article: target => ({ href: '#', onClick: event => { event.preventDefault(); openArticle(target); } }),
  };

  return (
    <dialog className="codex-dialog" ref={dialog} role="dialog" aria-labelledby={heading} aria-modal="true" onCancel={event => { event.preventDefault(); close(); }} {...backdrop} onKeyDown={event => event.stopPropagation()}>
      <header className="codex-header">
        <h2 id={heading}>{t('codex.title')}</h2>
        <div className="codex-header-actions">
          <CodexFavoriteButton target={currentTarget} />
          <CodexGuideLink entry={entry} page={page} article={article} />
          {showDetail && <button type="button" className="codex-back" onClick={() => {
            setShowDetail(false);
            requestAnimationFrame(() => dialog.current?.querySelector<HTMLButtonElement>('.codex-list [aria-current="true"]')?.focus());
          }}>{t('codex.back')}</button>}
          <CloseButton onClick={close} />
        </div>
      </header>
      <div className="codex-body" data-detail={showDetail}>
        <nav className="codex-list" aria-label={t('codex.title')}>
          <SearchField className="mb-3" label={t('codex.search')} value={search} onChange={setSearch} />
          {!hasResults && <p className="codex-search-empty" role="status">{t('codex.searchEmpty')}</p>}
          <CodexFavoritesNav idPrefix={heading} favorites={favorites} expanded={searching || favoritesOpen} onToggle={() => setFavoritesOpen(open => !open)} onChoose={openFavorite} />
          <CodexArticleNav idPrefix={heading} articles={filteredArticles} language={language} current={article} forceOpen={searching} openGroup={openSection} onToggle={setOpenSection} onChoose={openArticle} />
          {CODEX_SECTIONS.map(section => {
            const sectionEntries = filteredEntries.filter(item => item.section === section);
            const sectionPages = filteredPages.filter(item => item.section === section);
            if (searching && sectionEntries.length === 0 && sectionPages.length === 0) return null;
            const expanded = searching || openSection === section;
            const panelId = `${heading}-${section}`;
            return (
              <AccordionSection key={section} id={panelId} title={t(section)} expanded={expanded} chevron toggleClassName="codex-section-toggle" onToggle={() => setOpenSection(expanded ? '' : section)}>
                {sectionPages.map(item => <button key={item.id} type="button" aria-current={page === item.id ? 'true' : undefined} onClick={() => openPage(item.id)}>{t(item.title)}</button>)}
                {sectionEntries.map(entry => (
                  <button type="button" key={entry.id} aria-current={!pageOpen && selected === entry.id ? 'true' : undefined} onClick={() => select(entry.id)}>{t(entry.name)}</button>
                ))}
              </AccordionSection>
            );
          })}
        </nav>
        <article className="codex-detail" ref={detail} tabIndex={-1} aria-label={pageTitle}>
          {Page && <Page />}
          {article && <CodexArticle article={article} linker={linker} />}
          {!pageOpen && <CodexEntryContent entry={entry} manifest={manifest} key={entry.id} />}
          {!pageOpen && !manifest && (failed ? <div role="alert"><p>{t('codex.loadFailed')}</p><ActionButton onClick={retry}>{t('codex.retry')}</ActionButton></div> : <p role="status">{t('codex.loading')}</p>)}
        </article>
      </div>
    </dialog>
  );
}
