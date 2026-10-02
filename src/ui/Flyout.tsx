import { BuildMenuContent } from './BuildMenuContent';
import { useUi } from './hooks';

export function Flyout() {
  const flyout = useUi((store) => store.flyout);
  if (!flyout) return null;
  return (
    <div className="flyout">
      <BuildMenuContent />
    </div>
  );
}
