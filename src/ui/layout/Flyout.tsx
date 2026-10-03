import { BuildMenuContent } from '../build/BuildMenuContent';
import { useUi } from '../common/hooks';

export function Flyout() {
  const flyout = useUi((store) => store.flyout);
  if (!flyout) return null;
  return (
    <div className="flyout">
      <BuildMenuContent />
    </div>
  );
}
