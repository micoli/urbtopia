import { MAX_FLOORS, SHAPES, SHAPE_LABEL, addFloor, applyShape, removeFloor, type Plan } from './model.ts';

interface ShapePanelProps {
  plan: Plan;
  edit: (mutate: (plan: Plan) => void) => void;
}

export function ShapePanel({ plan, edit }: ShapePanelProps) {
  return (
    <section>
      <h2>Gabarit</h2>
      <div className="chips">
        {SHAPES.map((shape) => (
          <button key={shape} className="chip" onClick={() => edit((draft) => applyShape(draft, shape))}>
            {SHAPE_LABEL[shape]}
          </button>
        ))}
      </div>
      <div className="stepper">
        <span>Étages</span>
        <button className="chip" disabled={plan.floors.length <= 1} onClick={() => edit(removeFloor)}>
          −
        </button>
        <b>{plan.floors.length}</b>
        <button className="chip" disabled={plan.floors.length >= MAX_FLOORS} onClick={() => edit(addFloor)}>
          +
        </button>
      </div>
    </section>
  );
}
