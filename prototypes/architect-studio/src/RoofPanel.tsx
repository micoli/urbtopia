import { ActionButton } from '../../../src/ui/common/ActionButton.tsx';
import { Icon } from '../../../src/ui/common/Icon.tsx';
import { SectionHeading } from '../../../src/ui/common/SectionHeading.tsx';
import { Tabs, type TabItem } from '../../../src/ui/common/Tabs.tsx';
import { Chips } from './Chips.tsx';
import { t } from './i18n.ts';
import { AXIS_LABEL, DIR_NAMES, PITCH_LABEL, ROOF_LABEL, SPLIT_LABEL } from './labels.ts';
import {
  AXES,
  DEFAULT_ROOF,
  PITCHES,
  ROOFS,
  mansardCluster,
  roofRects,
  roofStyle,
  setAllRoofs,
  type Dir,
  type Plan,
  type RoofStyle,
  type Split,
} from './model.ts';

const SPLITS: Split[] = ['rows', 'cols'];

export type RoofTab = 'split' | 'wing';
const TABS: readonly TabItem<RoofTab>[] = [
  { id: 'wing', icon: 'selectionPanel', label: t('architect.roof.selected') },
  { id: 'split', icon: 'map', label: t('architect.roof.split') },
];

interface RoofPanelProps {
  plan: Plan;
  selectedKey?: string;
  tab: RoofTab;
  onTab: (tab: RoofTab) => void;
  edit: (mutate: (plan: Plan) => void) => void;
  onSplitChange: () => void;
}

export function RoofPanel({ plan, selectedKey, tab, onTab, edit, onSplitChange }: RoofPanelProps) {
  const selected = roofRects(plan).find((rect) => rect.key === selectedKey);

  const update = (patch: Partial<RoofStyle>) => {
    if (!selected) return;
    edit((draft) => {
      const rect = roofRects(draft).find((r) => r.key === selected.key);
      if (!rect) return;
      const targets = patch.pitch ? mansardCluster(draft, rect) : [rect];
      for (const target of targets) draft.roofStyles[target.key] = { ...roofStyle(draft, target), ...patch };
    });
  };

  const common = (
    <>
      <Chips
        label={t('architect.roof.split')}
        values={SPLITS}
        labels={SPLIT_LABEL}
        active={plan.roofSplit}
        onPick={(split) => {
          edit((draft) => { draft.roofSplit = split; });
          onSplitChange();
        }}
      />
      <SectionHeading>{t('architect.roof.all')}</SectionHeading>
      <Chips label={t('architect.roof.all')} values={ROOFS} labels={ROOF_LABEL} onPick={(type) => edit((draft) => setAllRoofs(draft, type))} />
    </>
  );

  const tabs = <Tabs
      label={t('architect.roof.tabs')}
      idPrefix="studio-roof"
      panelId="studio-roof-panel"
      tabs={TABS}
      selected={selected ? tab : 'split'}
      onSelect={(next) => (next === 'wing' && !selected ? undefined : onTab(next))}
  />;

  if (!selected || tab === 'split') {
    return (
      <div>
        {tabs}
        <div role="tabpanel" id="studio-roof-panel" aria-labelledby="studio-roof-split">{common}</div>
      </div>
    );
  }

  const style = roofStyle(plan, selected);
  const high = style.high ?? 0;
  const pointsToFace = style.type === 'shed' || style.type === 'saltbox';
  const dirs = ['0', '1', '2', '3'] as const;
  return (
    <div>
      {tabs}
      <div role="tabpanel" id="studio-roof-panel" aria-labelledby="studio-roof-wing">
      <Chips label={t('architect.roof.selected')} values={ROOFS} labels={ROOF_LABEL} active={style.type} onPick={(type) => update({ type })} />
      {pointsToFace ? (
        <>
          <SectionHeading>{style.type === 'shed' ? t('architect.roof.highFace') : t('architect.roof.ridgeSide')}</SectionHeading>
          <div className="studio-row">
            <Chips
              label={t('architect.roof.highFace')}
              values={dirs}
              labels={{ '0': DIR_NAMES[0]!, '1': DIR_NAMES[1]!, '2': DIR_NAMES[2]!, '3': DIR_NAMES[3]! }}
              active={String(high) as (typeof dirs)[number]}
              onPick={(dir) => update({ high: Number(dir) as Dir })}
            />
            <ActionButton size="sm" title={t('architect.roof.nextFace')} onClick={() => update({ high: ((high + 1) % 4) as Dir })}>
              <Icon name="loop" />
            </ActionButton>
          </div>
        </>
      ) : (
        <>
          <SectionHeading>{t('architect.roof.orientation')}</SectionHeading>
          <Chips label={t('architect.roof.orientation')} values={AXES} labels={AXIS_LABEL} active={style.axis} onPick={(axis) => update({ axis })} />
        </>
      )}
      <SectionHeading>{t('architect.roof.pitch')}</SectionHeading>
      <Chips label={t('architect.roof.pitch')} values={PITCHES} labels={PITCH_LABEL} active={style.pitch} onPick={(pitch) => update({ pitch })} />
      <ActionButton size="sm" onClick={() => edit((draft) => { delete draft.roofStyles[selected.key]; })}>
        {t('architect.roof.reset')} ({ROOF_LABEL[DEFAULT_ROOF.type]})
      </ActionButton>
      </div>
    </div>
  );
}
