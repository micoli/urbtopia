import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from 'zustand';
import type { BuildingType } from '../../core';
import { demonstrationsOf, demonstrationTypeOf } from '../../core/demonstrations/catalog';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { demonstrationPreferencesStore } from '../../store/demonstrationPreferencesStore';
import { ActionButton } from '../common/ActionButton';
import { Icon } from '../common/Icon';
import { CheckboxField } from '../common/CheckboxField';
import { useCloud, useGame } from '../common/hooks';
import './demonstrations.css';

/** Mounted once per interior visit, including when switching between buildings. */
export function DemonstrationPrompt({ type }: { type: BuildingType }) {
  useStore(prefsStore, store => store.language);
  const played = demonstrationTypeOf(type);
  const hidden = useStore(demonstrationPreferencesStore, store => store.hiddenTypes.includes(played) || store.seenTypes.includes(played));
  const challenge = useGame(store => Boolean(store.state.challenge));
  const saveConflict = useCloud(store => store.status.kind === 'conflict');
  const [dismissed, setDismissed] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const visible = !hidden && !dismissed && !challenge && !saveConflict && demonstrationsOf(type).length > 0;
  useEffect(() => {
    if (!visible) return;
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, [visible]);
  const dismiss = () => {
    if (dontShowAgain) demonstrationPreferencesStore.getState().hideInvitation(played);
    setDismissed(true);
  };
  const launch = async () => {
    const { demonstrationStore } = await import('../../store/demonstrationStore');
    if (demonstrationStore.getState().open(type)) dismiss();
  };
  if (!visible) return null;
  return createPortal(
    <dialog ref={dialogRef} className="demonstration-dialog demonstration-prompt" aria-labelledby="demonstration-prompt-title" aria-describedby="demonstration-prompt-description" onCancel={event => { event.preventDefault(); dismiss(); }} onKeyDown={event => event.stopPropagation()}>
      <header className="demonstration-header">
        <h2 id="demonstration-prompt-title">{t('demo.invitation.title')} · {t(`building.${type}`)}</h2>
      </header>
      <p id="demonstration-prompt-description">{t('demo.invitation.description')}</p>
      <CheckboxField label={t('demo.invitation.hide')} checked={dontShowAgain} onChange={setDontShowAgain} />
      <ActionButton variant="primary" block onClick={() => void launch()}><Icon name="movie" /> {t('demo.open')}</ActionButton>
      <ActionButton block onClick={dismiss}>{t('demo.invitation.skip')}</ActionButton>
    </dialog>,
    document.body,
  );
}
