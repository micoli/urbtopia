import { totalCitizens } from '../core';
import { useGame } from './hooks';
import { UrbsSymbol } from './UrbsSymbol';

export function MinimalStats() {
  const urbs = useGame((store) => store.state.urbs);
  const citizens = useGame((store) => totalCitizens(store.state));
  return (
    <div className="minimal-stats">
      <strong>{urbs}</strong> <UrbsSymbol /> · 👥 {citizens}
    </div>
  );
}
