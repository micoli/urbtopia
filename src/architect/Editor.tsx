import type { Edge, Plan } from '../core/architect/housePlan.ts';
import type { Mode, RoofTool } from './editorConstants.ts';
import type { SlotRef } from './render.ts';
import { availableTools, type FacadeTool } from './facadeTools.ts';
import { ToolPalette } from './ToolPalette.tsx';
import { FloorPlan } from './FloorPlan.tsx';
import { ColorsPanel } from './ColorsPanel.tsx';
import { FloorCountPanel } from './FloorCountPanel.tsx';
import { ModeTabs } from './ModeTabs.tsx';
import { RoofLevelPlan } from './RoofLevelPlan.tsx';
import { RoofMap } from './RoofMap.tsx';
import { RoofPanel, type RoofTab } from './RoofPanel.tsx';

interface EditorProps {
  plan: Plan;
  mode: Mode;
  floor: number;
  roofLevel: boolean;
  tool: FacadeTool;
  roofTool: RoofTool;
  selectedEdge?: Edge;
  roofKey?: string;
  roofTab: RoofTab;
  onRoofTab: (tab: RoofTab) => void;
  edit: (mutate: (plan: Plan) => void) => void;
  onModeChange: (mode: Mode) => void;
  onToolChange: (tool: FacadeTool) => void;
  onToggleCell: (c: number, r: number) => void;
  onPickSlot: (edge: Edge) => void;
  onPickColor: (key: 'wallColor' | 'roofColor', value: string) => void;
  onToggleChimney: (c: number, r: number) => void;
  onToggleDormer: (edge: Edge) => void;
  onSelectRoof: (key: string | undefined) => void;
  onHover: (ghost: SlotRef | undefined) => void;
}

export function Editor(props: EditorProps) {
  const { plan, mode, floor, roofLevel, tool, roofTool, selectedEdge, roofKey, edit } = props;
  const onRoofLevel = mode === 'facade' && roofLevel;
  return (
    <section>
      <ModeTabs mode={mode} onPick={props.onModeChange} />
      <div role="tabpanel" id="studio-editor" aria-labelledby={`studio-mode-${mode}`}>
      {mode === 'facade' && <ToolPalette tool={tool} available={availableTools(plan, floor, onRoofLevel)} onPick={props.onToolChange} />}
      {mode === 'colors' && <ColorsPanel wallColor={plan.wallColor} roofColor={plan.roofColor} onPick={props.onPickColor} />}
      {mode === 'roof' && <RoofMap plan={plan} roofKey={roofKey} onSelect={props.onSelectRoof} />}
      {mode === 'footprint' && <FloorCountPanel plan={plan} edit={edit} />}
      {(mode === 'footprint' || mode === 'facade') && onRoofLevel && (
        <RoofLevelPlan
          plan={plan}
          tool={roofTool}
          onToggleChimney={props.onToggleChimney}
          onToggleDormer={props.onToggleDormer}
          onHover={(edge) => props.onHover(edge && { ...edge, roof: true })}
        />
      )}
      {(mode === 'footprint' || mode === 'facade') && !onRoofLevel && (
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
      {mode === 'roof' && <RoofPanel plan={plan} selectedKey={roofKey} tab={props.roofTab} onTab={props.onRoofTab} edit={edit} onSplitChange={() => props.onSelectRoof(undefined)} />}
      </div>
    </section>
  );
}
