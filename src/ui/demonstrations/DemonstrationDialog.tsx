import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import { demonstrationsOf } from '../../core/demonstrations/catalog';
import type { Demonstration } from '../../core/demonstrations/scenario';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { demonstrationStore } from '../../store/demonstrationStore';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';
import { DemonstrationPlayer, demonstrationText } from './DemonstrationPlayer';
import './demonstrations.css';

export function DemonstrationDialog() {
  const type = useStore(demonstrationStore, store => store.buildingType);
  useStore(prefsStore, store => store.language);
  const [selected, setSelected] = useState<Demonstration | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const close = () => demonstrationStore.getState().close();
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);
  if (!type) return null;
  // A native modal shares the top layer with the Codex, so it remains above
  // its launching page and restores focus there when closed.
  return createPortal(
    <dialog ref={dialogRef} className="demonstration-dialog" aria-labelledby="demonstration-title" aria-describedby="demonstration-isolated" onCancel={event => { event.preventDefault(); close(); }} onKeyDown={event => event.stopPropagation()}>
      <header className="demonstration-header">
        <h2 id="demonstration-title">{selected ? demonstrationText(selected.title) : `${t('demo.open')} · ${t(`building.${type}`)}`}</h2>
        <div className="demonstration-header-actions">
          {selected ? <ActionButton className="demonstration-icon-button" onClick={() => setSelected(null)} aria-label={t('demo.back')} title={t('demo.back')}><Icon name="arrowLeft" /></ActionButton> : null}
          <ActionButton className="demonstration-icon-button" onClick={close} aria-label={t('demo.close')} title={t('demo.close')}><Icon name="close" /></ActionButton>
        </div>
      </header>
      <p id="demonstration-isolated" className="note">{t('demo.isolated')}</p>
      {selected ? <DemonstrationPlayer scenario={selected} /> : <>
        <h3>{t('demo.choose')}</h3>
        {demonstrationsOf(type).map(scenario => <ActionButton key={scenario.id} block onClick={() => setSelected(scenario)}>
          <Icon name="movie" /> <strong>{t(`demo.${scenario.level}`)}</strong> — {demonstrationText(scenario.objective)}
        </ActionButton>)}
      </>}
    </dialog>,
    document.body,
  );
}
