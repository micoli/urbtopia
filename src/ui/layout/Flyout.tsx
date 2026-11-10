import { BuildMenuContent } from '../build/BuildMenuContent';
import { useGame, useUi } from '../common/hooks';

export function Flyout() {
  const flyout = useUi((store) => store.flyout);
  const replanning = useGame((store) => store.state.replan !== undefined);
  if (!flyout || replanning) return null;
  return (
    <div className="flyout">
      <BuildMenuContent />
    </div>
  );
}
