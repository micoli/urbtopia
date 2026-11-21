import { useCallback, useState } from 'react';
import { ARCHITECT_TIER_COUNT, tierRequiredBy } from '../core/architect/architectTiers.ts';
import { StudioTierContext } from './studioTier.ts';
import { emptyPlan, exteriorEdges, newPlan, rectAt, roofRects, setBrick, toggleCell, toggleChimney, toggleDormer, type Brick, type Edge, type Plan, type Shape } from '../core/architect/housePlan.ts';
import type { Mode, RoofTool } from './editorConstants.ts';
import type { PickHit, SlotRef } from './render.ts';
import { Editor } from './Editor.tsx';
import type { RoofTab } from './RoofPanel.tsx';
import { effectiveTool, isRoofTool, type FacadeTool } from './facadeTools.ts';
import { sameEdge } from './FloorPlan.tsx';
import { HistoryBar } from './HistoryBar.tsx';
import { IssueNotes } from './IssueNotes.tsx';
import { LevelBar } from './LevelBar.tsx';
import { PlansButton } from './PlansButton.tsx';
import type { PlanLibrary } from './planLibrary.ts';
import { PlansPage } from './PlansPage.tsx';
import { PlanViewer } from './PlanViewer.tsx';
import { StatsCartouche } from './StatsCartouche.tsx';
import { viewHint } from './hints.ts';
import { ViewHint } from './ViewHint.tsx';
import { usePlanHistory } from './usePlanHistory.ts';
import { useUndoShortcuts } from './useUndoShortcuts.ts';

type ColorKey = 'wallColor' | 'roofColor';

const NEIGHBOURS = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]] as const;

// `standalone`: the prototype page, which keeps the JSON and GLB import and export the game does not offer.
export function ArchitectStudio({ library, standalone = false, tier = ARCHITECT_TIER_COUNT, onClose }: { library: PlanLibrary; standalone?: boolean; tier?: number; onClose?: () => void }) {
  // An edit that needs a higher Tier is refused, unless it brings a plan above the Tier of the office nearer to it: such a plan stays read-only.
  const allow = useCallback((next: Plan, present: Plan) => tierRequiredBy(next) <= Math.max(1, tier) || tierRequiredBy(next) < tierRequiredBy(present), [tier]);
  const { plan, canUndo, canRedo, edit, reset, undo, redo } = usePlanHistory(emptyPlan, allow);
  const [screen, setScreen] = useState<'edit' | 'plans'>('plans');
  const [hasPlan, setHasPlan] = useState(false);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<Mode>('footprint');
  const [brick, setBrickChoice] = useState<Brick>('window');
  const [floorChoice, setFloor] = useState(0);
  const [roofLevel, setRoofLevel] = useState(false);
  const [roofTool, setRoofTool] = useState<RoofTool>('dormer');
  const [roofChoice, setRoofChoice] = useState<string>();
  const [roofTab, setRoofTab] = useState<RoofTab>('split');
  const [selectedChoice, setSelected] = useState<Edge>();
  const [hover, setHover] = useState<SlotRef>();

  useUndoShortcuts(undo, redo);

  const floor = Math.min(floorChoice, plan.floors.length - 1);
  const onRoofLevel = mode === 'facade' && roofLevel;
  const tool = effectiveTool(plan, floor, roofLevel, brick, roofTool);
  const roofKey = roofRects(plan).some((rect) => rect.key === roofChoice) ? roofChoice : undefined;
  const selectedEdge = selectedChoice && exteriorEdges(plan).some((edge) => sameEdge(edge, selectedChoice)) ? selectedChoice : undefined;
  const ghost = hover ?? (mode === 'facade' && !roofLevel ? selectedEdge : undefined);

  const setRoofKey = useCallback((key: string | undefined) => {
    setRoofChoice(key);
    setRoofTab(key ? 'wing' : 'split');
  }, []);

  const pickInView = useCallback(
    (hit: PickHit) => {
      if (hit.kind === 'edge') {
        setMode('facade');
        setRoofLevel(false);
        setSelected(hit.edge);
        setFloor(hit.edge.floor);
        return;
      }
      const rect = NEIGHBOURS.map(([dc, dr]) => rectAt(plan, hit.col + dc, hit.row + dr)).find(Boolean);
      if (!rect) return;
      setMode('roof');
      setRoofKey(rect.key);
    },
    [plan, setRoofKey],
  );

  const open = (opened: Plan, planName: string) => {
    reset(opened);
    setHasPlan(true);
    setName(planName);
    setFloor(0);
    setRoofLevel(false);
    setRoofKey(undefined);
    setSelected(undefined);
    setHover(undefined);
    setMode('footprint');
    setScreen('edit');
  };

  const discard = () => {
    reset(emptyPlan());
    setHasPlan(false);
    setName('');
  };

  const pickTool = (tool: FacadeTool) => {
    setHover(undefined);
    if (isRoofTool(tool)) {
      setRoofTool(tool);
      setRoofLevel(true);
      return;
    }
    setBrickChoice(tool);
    setRoofLevel(false);
  };

  const create = (shape: Shape, planName: string) => open(newPlan(shape), planName);
  const pickColor = (key: ColorKey, value: string) => edit((draft) => { draft[key] = value; });

  if (screen === 'plans') {
    return (
      <StudioTierContext.Provider value={tier}>
      <div className="studio-root">
        <PlansPage library={library} plan={hasPlan ? plan : undefined} name={name} onName={setName} onCreate={create} onOpen={open} onBack={hasPlan ? () => setScreen('edit') : undefined} onDiscard={discard} standalone={standalone} onClose={onClose} />
      </div>
      </StudioTierContext.Provider>
    );
  }

  return (
    <StudioTierContext.Provider value={tier}>
    <div className="studio-root">
      <div className="studio-panel">
        <Editor
          plan={plan}
          mode={mode}
          floor={floor}
          roofLevel={roofLevel}
          tool={tool}
          roofTool={isRoofTool(tool) ? tool : roofTool}
          selectedEdge={selectedEdge}
          roofKey={roofKey}
          roofTab={roofTab}
          onRoofTab={setRoofTab}
          edit={edit}
          onModeChange={(next) => { setMode(next); setHover(undefined); }}
          onToolChange={pickTool}
          onPickColor={pickColor}
          onToggleCell={(c, r) => edit((draft) => toggleCell(draft, floor, c, r))}
          onPickSlot={(edge) => { setSelected(edge); edit((draft) => setBrick(draft, edge, isRoofTool(tool) ? brick : tool)); }}
          onToggleChimney={(c, r) => edit((draft) => toggleChimney(draft, c, r))}
          onToggleDormer={(edge) => edit((draft) => toggleDormer(draft, edge))}
          onSelectRoof={setRoofKey}
          onHover={setHover}
        />
      </div>
      <PlanViewer plan={plan} ghost={ghost} selectedRoof={mode === 'roof' ? roofKey : undefined} onPick={pickInView}>
        <div className="studio-corner">
          <HistoryBar canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} onClose={onClose} />
          <StatsCartouche plan={plan} />
        </div>
        <IssueNotes plan={plan} />
        <PlansButton onClick={() => setScreen('plans')} />
        <ViewHint hint={viewHint(mode, onRoofLevel)} />
        <LevelBar
          floorCount={plan.floors.length}
          floor={floor}
          roofLevel={onRoofLevel || mode === 'roof'}
          onPickFloor={(f) => { setFloor(f); setRoofLevel(false); setHover(undefined); if (mode === 'colors' || mode === 'roof') setMode('footprint'); }}
          onPickRoof={() => { setHover(undefined); if (mode === 'facade') { setRoofLevel(true); return; } setMode('roof'); }}
        />
      </PlanViewer>
    </div>
    </StudioTierContext.Provider>
  );
}
