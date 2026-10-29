import { useEffect, useId, useRef, useState } from 'react';
import { CODEX_ENTRIES, CODEX_SECTIONS, type CodexId, type CodexSection } from '../../codex/catalog';
import { matchesSearch } from '../../codex/matchesSearch';
import { CODEX_PAGES, type CodexPage } from '../../codex/pages';
import { t } from '../../i18n/t';
import { useUi } from '../common/hooks';
import { useBackdropClose } from '../common/useBackdropClose';
import { navButtonAt } from './navButtonAt';
import { CodexEntryContent } from './CodexEntryContent';
import { CodexGuideLink } from './CodexGuideLink';
import { ProductionChainsPage } from './ProductionChainsPage';
import { CropEconomyPage } from './CropEconomyPage';
import { ChallengesPage } from './ChallengesPage';
import { EnergyProductionPage } from './EnergyProductionPage';
import { MarketRulesPage } from './MarketRulesPage';
import { SanctionsPage } from './SanctionsPage';
import { StorageRulesPage } from './StorageRulesPage';
import { SolidarityPage } from './SolidarityPage';
import { AnalyticsPage } from './AnalyticsPage';
import { WastePage } from './WastePage';
import { TransitReachPage } from './TransitReachPage';
import { PoliticsPage } from './PoliticsPage';
import { useCodexManifest } from './useCodexManifest';
import { CloseButton } from '../common/CloseButton';
import { ActionButton } from '../common/ActionButton';
import { AccordionSection } from '../common/AccordionSection';

export function CodexPanel() {
  const close = useUi(store => store.closeCodex);
  const dismiss = useUi(store => store.dismissCodex);
  const backdrop = useBackdropClose(event => {
    const nav = navButtonAt(event.clientX, event.clientY);
    if (!nav || nav.dataset.action === 'codex') return close();
    dismiss();
    nav.click();
  });
  const initialEntry = useUi(store => store.codexEntryId);
  const initialDetail = useUi(store => store.codexShowDetail);
  const initialFlyout = useUi(store => store.codexFromFlyout);
  const initialPage = useUi(store => store.codexPage);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const [selected, setSelected] = useState<CodexId>(initialEntry);
  const [showDetail, setShowDetail] = useState(initialDetail);
  const [page, setPage] = useState<CodexPage | null>(initialPage);
  const [search, setSearch] = useState('');
  const pageOpen = page !== null;
  const [openSection, setOpenSection] = useState<CodexSection>(CODEX_PAGES.find(item => item.id === initialPage)?.section ?? CODEX_ENTRIES.find(entry => entry.id === initialEntry)!.section);
  const { manifest, failed, retry } = useCodexManifest();
  const entry = CODEX_ENTRIES.find(entry => entry.id === selected)!;
  const detail = useRef<HTMLElement>(null);
  const filteredEntries = CODEX_ENTRIES.filter(item => matchesSearch(`${t(item.name)} ${t(item.description)} ${t(item.section)}`, search));
  const filteredPages = CODEX_PAGES.filter(item => matchesSearch(`${t(item.title)} ${t(item.description)} ${t(item.section)}`, search));
  const hasResults = search.trim() === '' || filteredEntries.length > 0 || filteredPages.length > 0;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousEntry = previous?.getAttribute('data-codex-id') ?? previous?.getAttribute('data-codex-label') ?? (initialDetail && initialFlyout ? initialEntry : null);
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
    setSelected(id);
    setOpenSection(CODEX_ENTRIES.find(entry => entry.id === id)!.section);
    setShowDetail(true);
  };

  return (
    <dialog className="codex-dialog" ref={dialog} role="dialog" aria-labelledby={heading} aria-modal="true" onCancel={event => { event.preventDefault(); close(); }} {...backdrop} onKeyDown={event => event.stopPropagation()}>
      <header className="codex-header">
        <h2 id={heading}>{t('codex.title')}</h2>
        <div className="codex-header-actions">
          <CodexGuideLink entry={entry} page={page} />
          {showDetail && <button type="button" className="codex-back" onClick={() => {
            setShowDetail(false);
            requestAnimationFrame(() => dialog.current?.querySelector<HTMLButtonElement>('.codex-list [aria-current="true"]')?.focus());
          }}>{t('codex.back')}</button>}
          <CloseButton onClick={close} />
        </div>
      </header>
      <div className="codex-body" data-detail={showDetail}>
        <nav className="codex-list" aria-label={t('codex.title')}>
          <input
            className="codex-search"
            type="search"
            aria-label={t('codex.search')}
            placeholder={t('codex.search')}
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
          {!hasResults && <p className="codex-search-empty" role="status">{t('codex.searchEmpty')}</p>}
          {CODEX_SECTIONS.map(section => {
            const sectionEntries = filteredEntries.filter(item => item.section === section);
            const sectionPages = filteredPages.filter(item => item.section === section);
            if (search.trim() && sectionEntries.length === 0 && sectionPages.length === 0) return null;
            const expanded = search.trim() !== '' || openSection === section;
            const panelId = `${heading}-${section}`;
            return (
              <AccordionSection key={section} id={panelId} title={t(section)} expanded={expanded} chevron toggleClassName="codex-section-toggle" onToggle={() => setOpenSection(expanded ? ('' as CodexSection) : section)}>
                {sectionPages.map(item => <button key={item.id} type="button" aria-current={page === item.id ? 'true' : undefined} onClick={() => { setPage(item.id); setShowDetail(true); }}>{t(item.title)}</button>)}
                {sectionEntries.map(entry => (
                  <button type="button" key={entry.id} aria-current={!pageOpen && selected === entry.id ? 'true' : undefined} onClick={() => select(entry.id)}>{t(entry.name)}</button>
                ))}
              </AccordionSection>
            );
          })}
        </nav>
        <article className="codex-detail" ref={detail} tabIndex={-1} aria-label={t(page === 'economy' ? 'codex.economy.title' : page === 'storage' ? 'codex.storage.title' : page === 'energy' ? 'codex.energy.title' : page === 'sanctions' ? 'codex.sanctions.title' : page === 'market' ? 'codex.market.title' : page === 'challenges' ? 'codex.challenges.title' : page === 'solidarity' ? 'codex.solidarity.title' : page === 'waste' ? 'codex.waste.title' : page === 'politics' ? 'codex.politics.title' : page === 'transitReach' ? 'codex.transitReach.title' : page === 'chains' ? 'codex.chains.title' : page === 'analytics' ? 'codex.analytics.title' : entry.name)}>
          {page === 'economy' && <CropEconomyPage />}
          {page === 'storage' && <StorageRulesPage />}
          {page === 'energy' && <EnergyProductionPage />}
          {page === 'sanctions' && <SanctionsPage />}
          {page === 'market' && <MarketRulesPage />}
          {page === 'challenges' && <ChallengesPage />}
          {page === 'solidarity' && <SolidarityPage />}
          {page === 'waste' && <WastePage />}
          {page === 'politics' && <PoliticsPage />}
          {page === 'transitReach' && <TransitReachPage />}
          {page === 'chains' && <ProductionChainsPage />}
          {page === 'analytics' && <AnalyticsPage />}
          {!pageOpen && <CodexEntryContent entry={entry} manifest={manifest} key={entry.id} />}
          {!pageOpen && !manifest && (failed ? <div role="alert"><p>{t('codex.loadFailed')}</p><ActionButton onClick={retry}>{t('codex.retry')}</ActionButton></div> : <p role="status">{t('codex.loading')}</p>)}
        </article>
      </div>
    </dialog>
  );
}
