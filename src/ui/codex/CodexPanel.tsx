import { useEffect, useId, useRef, useState } from 'react';
import { CODEX_ENTRIES, CODEX_SECTIONS, type CodexId, type CodexSection } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { useUi } from '../common/hooks';
import { CodexEntryContent } from './CodexEntryContent';
import { CropEconomyPage } from './CropEconomyPage';
import { EnergyProductionPage } from './EnergyProductionPage';
import { StorageRulesPage } from './StorageRulesPage';
import { useCodexManifest } from './useCodexManifest';
import { CloseButton } from '../common/CloseButton';
import { ActionButton } from '../common/ActionButton';
import { AccordionSection } from '../common/AccordionSection';

export function CodexPanel() {
  const close = useUi(store => store.closeCodex);
  const initialEntry = useUi(store => store.codexEntryId);
  const initialDetail = useUi(store => store.codexShowDetail);
  const initialFlyout = useUi(store => store.codexFromFlyout);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const [selected, setSelected] = useState<CodexId>(initialEntry);
  const [showDetail, setShowDetail] = useState(initialDetail);
  const [page, setPage] = useState<'economy' | 'storage' | 'energy' | null>(null);
  const pageOpen = page !== null;
  const [openSection, setOpenSection] = useState<CodexSection>(CODEX_ENTRIES.find(entry => entry.id === initialEntry)!.section);
  const { manifest, failed, retry } = useCodexManifest();
  const entry = CODEX_ENTRIES.find(entry => entry.id === selected)!;
  const detail = useRef<HTMLElement>(null);

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
    <dialog className="codex-dialog" ref={dialog} role="dialog" aria-labelledby={heading} aria-modal="true" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={event => event.stopPropagation()}>
      <header className="codex-header">
        <h2 id={heading}>{t('codex.title')}</h2>
        <div className="codex-header-actions">
          {showDetail && <button type="button" className="codex-back" onClick={() => {
            setShowDetail(false);
            requestAnimationFrame(() => dialog.current?.querySelector<HTMLButtonElement>('.codex-list [aria-current="true"]')?.focus());
          }}>{t('codex.back')}</button>}
          <CloseButton onClick={close} />
        </div>
      </header>
      <div className="codex-body" data-detail={showDetail}>
        <nav className="codex-list" aria-label={t('codex.title')}>
          {CODEX_SECTIONS.map(section => {
            const expanded = openSection === section;
            const panelId = `${heading}-${section}`;
            return (
              <AccordionSection key={section} id={panelId} title={t(section)} expanded={expanded} chevron toggleClassName="codex-section-toggle" onToggle={() => setOpenSection(expanded ? ('' as CodexSection) : section)}>
                {section === 'codex.crops' && (
                  <button type="button" aria-current={page === 'economy' ? 'true' : undefined} onClick={() => { setPage('economy'); setShowDetail(true); }}>{t('codex.economy.title')}</button>
                )}
                {section === 'build.utilities' && (
                  <button type="button" aria-current={page === 'energy' ? 'true' : undefined} onClick={() => { setPage('energy'); setShowDetail(true); }}>{t('codex.energy.title')}</button>
                )}
                {section === 'build.storage' && (
                  <button type="button" aria-current={page === 'storage' ? 'true' : undefined} onClick={() => { setPage('storage'); setShowDetail(true); }}>{t('codex.storage.title')}</button>
                )}
                {CODEX_ENTRIES.filter(entry => entry.section === section).map(entry => (
                  <button type="button" key={entry.id} aria-current={!pageOpen && selected === entry.id ? 'true' : undefined} onClick={() => select(entry.id)}>{t(entry.name)}</button>
                ))}
              </AccordionSection>
            );
          })}
        </nav>
        <article className="codex-detail" ref={detail} tabIndex={-1} aria-label={t(page === 'economy' ? 'codex.economy.title' : page === 'storage' ? 'codex.storage.title' : page === 'energy' ? 'codex.energy.title' : entry.name)}>
          {page === 'economy' && <CropEconomyPage />}
          {page === 'storage' && <StorageRulesPage />}
          {page === 'energy' && <EnergyProductionPage />}
          {!pageOpen && <CodexEntryContent entry={entry} manifest={manifest} key={entry.id} />}
          {!pageOpen && !manifest && (failed ? <div role="alert"><p>{t('codex.loadFailed')}</p><ActionButton onClick={retry}>{t('codex.retry')}</ActionButton></div> : <p role="status">{t('codex.loading')}</p>)}
        </article>
      </div>
    </dialog>
  );
}
