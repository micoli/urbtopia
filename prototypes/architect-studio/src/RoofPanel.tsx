import {
  AXES,
  AXIS_LABEL,
  DEFAULT_ROOF,
  DIR_NAMES,
  PITCHES,
  PITCH_LABEL,
  ROOFS,
  ROOF_LABEL,
  SPLIT_LABEL,
  mansardCluster,
  roofRects,
  roofStyle,
  setAllRoofs,
  type Dir,
  type Plan,
  type RoofStyle,
  type Split,
} from './model.ts';
import { Chips } from './Chips.tsx';

interface RoofPanelProps {
  plan: Plan;
  selectedKey?: string;
  edit: (mutate: (plan: Plan) => void) => void;
  onSplitChange: () => void;
}

export function RoofPanel({ plan, selectedKey, edit, onSplitChange }: RoofPanelProps) {
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
      <h2>Découpe en ailes</h2>
      <Chips<Split>
        values={['rows', 'cols']}
        labels={SPLIT_LABEL}
        active={plan.roofSplit}
        onPick={(split) => {
          edit((draft) => { draft.roofSplit = split; });
          onSplitChange();
        }}
      />
      <h2>Tous les toits</h2>
      <Chips values={ROOFS} labels={ROOF_LABEL} onPick={(type) => edit((draft) => setAllRoofs(draft, type))} />
    </>
  );

  if (!selected) {
    return (
      <div>
        {common}
        <p className="hint">Cliquer une aile sur le plan pour régler son toit. Le chiffre est le nombre d’étages.</p>
      </div>
    );
  }

  const style = roofStyle(plan, selected);
  const high = style.high ?? 0;
  const pointsToFace = style.type === 'shed' || style.type === 'saltbox';
  return (
    <div>
      {common}
      <h2>Aile sélectionnée</h2>
      <Chips values={ROOFS} labels={ROOF_LABEL} active={style.type} onPick={(type) => update({ type })} />
      {pointsToFace ? (
        <>
          <h2>{style.type === 'shed' ? 'Face haute' : 'Faîtage côté'}</h2>
          <div className="chips">
            {DIR_NAMES.map((name, i) => (
              <button key={name} className={i === high ? 'chip on' : 'chip'} onClick={() => update({ high: i as Dir })}>
                {name}
              </button>
            ))}
            <button className="chip" title="Face suivante" onClick={() => update({ high: ((high + 1) % 4) as Dir })}>
              ↻
            </button>
          </div>
        </>
      ) : (
        <>
          <h2>Orientation</h2>
          <Chips values={AXES} labels={AXIS_LABEL} active={style.axis} onPick={(axis) => update({ axis })} />
        </>
      )}
      <h2>Pente</h2>
      <Chips values={PITCHES} labels={PITCH_LABEL} active={style.pitch} onPick={(pitch) => update({ pitch })} />
      <button
        className="chip"
        onClick={() => edit((draft) => { delete draft.roofStyles[selected.key]; })}
      >
        Réinitialiser ({ROOF_LABEL[DEFAULT_ROOF.type]})
      </button>
    </div>
  );
}
