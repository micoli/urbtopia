import { useEffect, useId, useRef, useState } from 'react';
import { CODEX_ENTRIES, CODEX_SECTIONS, type CodexId, type CodexSection } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { useUi } from '../common/hooks';
import { CodexEntryContent } from './CodexEntryContent';
import { useCodexManifest } from './useCodexManifest';

export function CodexPanel() {
  const close = useUi(store => store.closeCodex);
  const initialEntry = useUi(store => store.codexEntryId);
  const initialDetail = useUi(store => store.codexShowDetail);
  const initialFlyout = useUi(store => store.codexFromFlyout);
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const [selected, setSelected] = useState<CodexId>(initialEntry);
  const [showDetail, setShowDetail] = useState(initialDetail);
  const [openSection, setOpenSection] = useState<CodexSection>(CODEX_ENTRIES.find(entry => entry.id === initialEntry)!.section);
  const { manifest, failed, retry } = useCodexManifest();
  const entry = CODEX_ENTRIES.find(entry => entry.id === selected)!;
  const detail = useRef<HTMLElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousEntry = previous?.getAttribute('data-codex-id') ?? (initialDetail && initialFlyout ? initialEntry : null);
    dialog.current?.showModal();
    return () => {
      requestAnimationFrame(() => {
        if (previous?.isConnected && previous !== document.body) return previous.focus();
        if (previousEntry) {
          const trigger = [...document.querySelectorAll<HTMLButtonElement>('[data-codex-id]')].find(button => button.dataset.codexId === previousEntry);
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
  }, [selected, showDetail]);

  const select = (id: CodexId) => {
    setSelected(id);
    setOpenSection(CODEX_ENTRIES.find(entry => entry.id === id)!.section);
    setShowDetail(true);
  };

  return (
    <dialog className="codex-dialog" ref={dialog} role="dialog" aria-labelledby={heading} aria-modal="true" onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => event.stopPropagation()}>
      <header className="codex-header">
        <h2 id={heading}>{t('codex.title')}</h2>
        <div className="codex-header-actions">
          {showDetail && <button type="button" className="codex-back" onClick={() => {
            setShowDetail(false);
            requestAnimationFrame(() => dialog.current?.querySelector<HTMLButtonElement>('.codex-list [aria-current="true"]')?.focus());
          }}>{t('codex.back')}</button>}
          <button type="button" className="panel-close" aria-label={t('panel.close')} onClick={close}>✕</button>
        </div>
      </header>
      <div className="codex-body" data-detail={showDetail}>
        <nav className="codex-list" aria-label={t('codex.title')}>
          {CODEX_SECTIONS.map(section => {
            const expanded = openSection === section;
            const panelId = `${heading}-${section}`;
            return (
              <section key={section} aria-label={t(section)}>
                <h3>
                  <button type="button" className="codex-section-toggle" aria-expanded={expanded} aria-controls={panelId} onClick={() => setOpenSection(expanded ? ('' as CodexSection) : section)}>
                    <span>{t(section)}</span>
                    <span aria-hidden="true">{expanded ? '▾' : '▸'}</span>
                  </button>
                </h3>
                <div id={panelId} hidden={!expanded}>
                  {CODEX_ENTRIES.filter(entry => entry.section === section).map(entry => (
                    <button type="button" key={entry.id} aria-current={selected === entry.id ? 'true' : undefined} onClick={() => select(entry.id)}>{t(entry.name)}</button>
                  ))}
                </div>
              </section>
            );
          })}
        </nav>
        <article className="codex-detail" ref={detail} tabIndex={-1} aria-label={t(entry.name)}>
          <CodexEntryContent entry={entry} manifest={manifest} key={entry.id} />
          {!manifest && (failed ? <div role="alert"><p>{t('codex.loadFailed')}</p><button type="button" onClick={retry}>{t('codex.retry')}</button></div> : <p role="status">{t('codex.loading')}</p>)}
        </article>
      </div>
    </dialog>
  );
}
