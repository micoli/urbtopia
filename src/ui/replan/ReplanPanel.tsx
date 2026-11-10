import { useState } from 'react';
import { isReplanSummaryEmpty, replanSummary } from '../../core';
import { codexImageKey, type CodexId } from '../../codex/catalog';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { replanSummaryStore } from '../../store/replanSummaryStore';
import { uiStore } from '../../store/uiStore';
import { AccordionSection } from '../common/AccordionSection';
import { Icon } from '../common/Icon';
import { IconButton } from '../common/IconButton';
import { ActionButton } from '../common/ActionButton';
import { useGame } from '../common/hooks';
import { useCodexManifest } from '../codex/useCodexManifest';
import { ReplanConfirmDialog } from './ReplanConfirmDialog';
import { StashGroupButton } from './StashGroupButton';
import { stashSections, type StashSectionId } from './stashGroups';

// Sits where the build menu sits, beside the dock, so the dock stays within reach.
export function ReplanPanel() {
  const state = useGame((store) => store.state);
  const [cancelling, setCancelling] = useState(false);
  const [openSection, setOpenSection] = useState<StashSectionId | null>('replan.section.network');
  const [listOpen, setListOpen] = useState(true);
  const { manifest } = useCodexManifest();
  if (!state.replan) return null;
  const sections = stashSections(state);
  const previewOf = (id: CodexId | undefined) => {
    const image = id ? manifest?.images[codexImageKey(id, 1, undefined)] : undefined;
    return image ? `${import.meta.env.BASE_URL}codex/${image}` : undefined;
  };

  const finish = () => {
    uiStore.getState().cancelTool();
    const summary = replanSummary(state);
    gameStore.getState().send({ type: 'FinishReplan' });
    if (!gameStore.getState().state.replan && !isReplanSummaryEmpty(summary)) replanSummaryStore.getState().show(summary);
  };
  const cancel = () => {
    setCancelling(false);
    uiStore.getState().cancelTool();
    gameStore.getState().send({ type: 'CancelReplan' });
  };

  return (
    <aside className="flyout replan-flyout" data-collapsed={!listOpen} aria-label={t('replan.title')}>
      <h2>{t('replan.title')}</h2>
      <div className="replan-actions">
        <ActionButton size="sm" onClick={() => setCancelling(true)}>{t('replan.cancel')}</ActionButton>
        <IconButton label={t(listOpen ? 'replan.hideList' : 'replan.showList')} aria-expanded={listOpen} onClick={() => setListOpen(!listOpen)}>
          <Icon name={listOpen ? 'chevronUp' : 'chevronDown'} />
        </IconButton>
        <ActionButton size="sm" variant="primary" disabled={sections.length > 0} onClick={finish}>{t('replan.finish')}</ActionButton>
      </div>
      {listOpen && sections.length === 0 ? <p>{t('replan.stashEmpty')}</p> : null}
      {listOpen ? sections.map((section) => (
        <AccordionSection
          key={section.id}
          id={`replan-${section.id}`}
          title={t(section.id)}
          expanded={openSection === section.id}
          chevron
          className="build-section"
          toggleClassName="build-section-toggle"
          contentClassName="build-section-items"
          onToggle={() => setOpenSection(openSection === section.id ? null : section.id)}
        >
          {section.groups.map((group) => <StashGroupButton key={group.id} group={group} preview={previewOf(group.codexId)} />)}
        </AccordionSection>
      )) : null}
      {cancelling ? <ReplanConfirmDialog title={t('replan.cancelTitle')} body={t('replan.cancelBody')} confirmLabel={t('replan.cancel')} keepLabel={t('replan.keep')} onConfirm={cancel} onClose={() => setCancelling(false)} /> : null}
    </aside>
  );
}
