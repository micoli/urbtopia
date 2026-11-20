import { useCallback, useState } from 'react';
import { emptyPlan, exteriorEdges, rectAt, roofRects, setBrick, toggleCell, toggleChimney, toggleDormer, type Brick, type Edge, type Plan } from './model.ts';
import type { Mode } from './editorConstants.ts';
import type { PickHit, SlotRef } from './render.ts';
import { ColorsPanel } from './ColorsPanel.tsx';
import { Editor } from './Editor.tsx';
import { sameEdge } from './FloorPlan.tsx';
import { HistoryBar } from './HistoryBar.tsx';
import { Library } from './Library.tsx';
import { PlanViewer } from './PlanViewer.tsx';
import { ShapePanel } from './ShapePanel.tsx';
import { StatsPanel } from './StatsPanel.tsx';
import { usePlanHistory } from './usePlanHistory.ts';
import { useUndoShortcuts } from './useUndoShortcuts.ts';

type ColorKey = 'wallColor' | 'roofColor';

const NEIGHBOURS = [[0, 0], [0, -1], [0, 1], [-1, 0], [1, 0]] as const;

export function App() {
  const { plan, canUndo, canRedo, edit, replace, undo, redo } = usePlanHistory(emptyPlan);
  const [mode, setMode] = useState<Mode>('footprint');
  const [brick, setBrickChoice] = useState<Brick>('window');
  const [floorChoice, setFloor] = useState(0);
  const [roofLevel, setRoofLevel] = useState(false);
  const [roofChoice, setRoofKey] = useState<string>();
  const [selectedChoice, setSelected] = useState<Edge>();
  const [hover, setHover] = useState<SlotRef>();

  useUndoShortcuts(undo, redo);

  const floor = Math.min(floorChoice, plan.floors.length - 1);
  const roofKey = roofRects(plan).some((rect) => rect.key === roofChoice) ? roofChoice : undefined;
  const selectedEdge = selectedChoice && exteriorEdges(plan).some((edge) => sameEdge(edge, selectedChoice)) ? selectedChoice : undefined;
  const ghost = hover ?? (mode === 'facade' && !roofLevel ? selectedEdge : undefined);

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
    [plan],
  );

  const load = (loaded: Plan) => {
    setFloor(0);
    setRoofKey(undefined);
    setSelected(undefined);
    replace(loaded);
  };

  const pickColor = (key: ColorKey, value: string) => edit((draft) => { draft[key] = value; });

  return (
    <>
      <aside id="panel">
        <h1>Cabinet d'architecture</h1>
        <HistoryBar canUndo={canUndo} canRedo={canRedo} onUndo={undo} onRedo={redo} />
        <Library plan={plan} onLoad={load} />
        <ShapePanel plan={plan} edit={edit} />
        <Editor
          plan={plan}
          mode={mode}
          floor={floor}
          roofLevel={roofLevel}
          brick={brick}
          selectedEdge={selectedEdge}
          roofKey={roofKey}
          edit={edit}
          onModeChange={setMode}
          onFloorChange={(f) => { setFloor(f); setRoofLevel(false); }}
          onRoofLevel={() => setRoofLevel(true)}
          onBrickChange={setBrickChoice}
          onToggleCell={(c, r) => edit((draft) => toggleCell(draft, floor, c, r))}
          onPickSlot={(edge) => { setSelected(edge); edit((draft) => setBrick(draft, edge, brick)); }}
          onToggleChimney={(c, r) => edit((draft) => toggleChimney(draft, c, r))}
          onToggleDormer={(edge) => edit((draft) => toggleDormer(draft, edge))}
          onSelectRoof={setRoofKey}
          onHover={setHover}
        />
        <ColorsPanel wallColor={plan.wallColor} roofColor={plan.roofColor} onPick={pickColor} />
        <StatsPanel plan={plan} />
      </aside>
      <PlanViewer plan={plan} ghost={ghost} selectedRoof={mode === 'roof' ? roofKey : undefined} onPick={pickInView} />
    </>
  );
}
