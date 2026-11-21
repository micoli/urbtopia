import { Tabs, type TabItem } from '../ui/common/Tabs.tsx';
import { MODES, MODE_LABEL, type Mode } from './editorConstants.ts';
import { t } from '../i18n/t';

const ICONS = { footprint: 'map', facade: 'city', roof: 'shield', colors: 'sparkles' } as const;
const TABS: readonly TabItem<Mode>[] = MODES.map((mode) => ({ id: mode, icon: ICONS[mode], label: MODE_LABEL[mode] }));

interface ModeTabsProps {
  mode: Mode;
  onPick: (mode: Mode) => void;
}

export function ModeTabs({ mode, onPick }: ModeTabsProps) {
  return (
    <div className="studio-tabs-sticky">
      <Tabs label={t('architect.mode')} idPrefix="studio-mode" panelId="studio-editor" tabs={TABS} selected={mode} onSelect={onPick} />
    </div>
  );
}
