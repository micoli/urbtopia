import type { Brick, Edge, Plan } from './model.ts';
import { DORMER_PRICE, CHIMNEY_PRICE } from './model.ts';
import type { Mode } from './editorConstants.ts';
import type { SlotRef } from './render.ts';
import { BrickPalette } from './BrickPalette.tsx';
import { FloorPlan } from './FloorPlan.tsx';
import { FloorTabs } from './FloorTabs.tsx';
import { ModeTabs } from './ModeTabs.tsx';
import { RoofLevelPlan } from './RoofLevelPlan.tsx';
import { RoofMap } from './RoofMap.tsx';
import { RoofPanel } from './RoofPanel.tsx';

const HINT: Record<Mode, string> = {
  footprint: "Cliquer une case pour l'ajouter ou la retirer. Un étage ne peut s'étendre que sur les cases de l'étage du dessous.",
  facade: 'Choisir une brique puis cliquer un côté du plan. Nord en haut.',
  roof: 'Cliquer une aile pour régler son toit. Le chiffre est le nombre d’étages.',
};

const ROOF_LEVEL_HINT = `Niveau Toit : cliquer un côté (sous une mansarde) pour une lucarne · ${DORMER_PRICE}€, cliquer une case pour une cheminée · ${CHIMNEY_PRICE}€.`;

interface EditorProps {
  plan: Plan;
  mode: Mode;
  floor: number;
  roofLevel: boolean;
  brick: Brick;
  selectedEdge?: Edge;
  roofKey?: string;
  edit: (mutate: (plan: Plan) => void) => void;
  onModeChange: (mode: Mode) => void;
  onFloorChange: (floor: number) => void;
  onRoofLevel: () => void;
  onBrickChange: (brick: Brick) => void;
  onToggleCell: (c: number, r: number) => void;
  onPickSlot: (edge: Edge) => void;
  onToggleChimney: (c: number, r: number) => void;
  onToggleDormer: (edge: Edge) => void;
  onSelectRoof: (key: string | undefined) => void;
  onHover: (ghost: SlotRef | undefined) => void;
}

export function Editor(props: EditorProps) {
  const { plan, mode, floor, roofLevel, brick, selectedEdge, roofKey, edit } = props;
  const onRoofLevel = mode === 'facade' && roofLevel;
  return (
    <section>
      <ModeTabs mode={mode} onPick={props.onModeChange} />
      {mode !== 'roof' && (
        <FloorTabs
          floorCount={plan.floors.length}
          floor={floor}
          roofLevel={roofLevel}
          withRoof={mode === 'facade'}
          onPickFloor={props.onFloorChange}
          onPickRoof={props.onRoofLevel}
        />
      )}
      {mode === 'facade' && !onRoofLevel && <BrickPalette brick={brick} onPick={props.onBrickChange} />}
      {mode === 'roof' && <RoofMap plan={plan} roofKey={roofKey} onSelect={props.onSelectRoof} />}
      {mode !== 'roof' && onRoofLevel && (
        <RoofLevelPlan
          plan={plan}
          onToggleChimney={props.onToggleChimney}
          onToggleDormer={props.onToggleDormer}
          onHover={(edge) => props.onHover(edge && { ...edge, roof: true })}
        />
      )}
      {mode !== 'roof' && !onRoofLevel && (
        <FloorPlan
          plan={plan}
          floor={floor}
          mode={mode}
          selected={selectedEdge}
          onToggleCell={props.onToggleCell}
          onPickSlot={props.onPickSlot}
          onHover={props.onHover}
        />
      )}
      <p className="hint">{onRoofLevel ? ROOF_LEVEL_HINT : HINT[mode]}</p>
      {mode === 'roof' && <RoofPanel plan={plan} selectedKey={roofKey} edit={edit} onSplitChange={() => props.onSelectRoof(undefined)} />}
    </section>
  );
}
