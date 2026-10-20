import { isPoliticsActive } from '../../core';
import { t } from '../../i18n/t';
import { CloseButton } from '../common/CloseButton';
import { ActionButton } from '../common/ActionButton';
import { Note } from '../common/Note';
import { useGame, useUi } from '../common/hooks';
import { useModalFocus } from '../stats/management/useModalFocus';
import { CouncilSection } from './CouncilSection';
import { OrdinancesSection } from './OrdinancesSection';
import { PetitionsSection } from './PetitionsSection';
import { PoliticsObjectivesSection } from './PoliticsObjectivesSection';
import { PoliticsSummary } from './PoliticsSummary';

export function PoliticsWindow() {
  const state = useGame(store => store.state);
  const open = useUi(store => store.politicsOpen);
  const close = useUi(store => store.closePolitics);
  const openCodex = useUi(store => store.openCodex);
  const panel = useModalFocus(open, close);
  if (!open) return null;
  return (
    <div className="dialog-backdrop city-management-backdrop" onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="eco-dashboard politics-window" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="politics-heading">
        <header className="eco-header">
          <h2 id="politics-heading">{t('politics.title')}</h2>
          <ActionButton aria-label={t('codex.about').replace('{name}', t('codex.politics.title'))} onClick={() => openCodex(undefined, 'politics')}>{t('politics.rules')}&nbsp;?</ActionButton>
          <CloseButton onClick={close} />
        </header>
        {isPoliticsActive(state) && state.politics
          ? (
            <div className="eco-sections">
              <PoliticsSummary state={state} />
              <CouncilSection state={state} />
              <PoliticsObjectivesSection state={state} />
              <OrdinancesSection state={state} />
              <PetitionsSection state={state} />
            </div>
          )
          : <Note tone="muted">{t('politics.inactive')}</Note>}
      </div>
    </div>
  );
}
