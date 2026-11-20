import { stats, type Plan } from './model.ts';

export function StatsPanel({ plan }: { plan: Plan }) {
  const st = stats(plan);
  return (
    <section>
      <h2>Plan</h2>
      <div className="kpis">
        <div>
          <b>{st.cost} €</b>coût
        </div>
        <div>
          <b>{st.citizens}</b>habitants
        </div>
        <div>
          <b>{st.cells}</b>cases
        </div>
        <div>
          <b>{st.openings}</b>ouvertures
        </div>
      </div>
      {st.issues.map((issue) => (
        <p key={issue} className="issue">
          ⚠ {issue}
        </p>
      ))}
      {st.issues.length === 0 && <p className="ok">✓ Plan constructible</p>}
    </section>
  );
}
