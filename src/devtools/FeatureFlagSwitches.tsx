import { useStore } from 'zustand';
import { FLAGS, FLAG_IDS, featureFlagStore } from '../featureFlags/featureFlags';

// One switch per feature that ships off; a switch holds across reloads, in this browser only.
export function FeatureFlagSwitches() {
  const enabled = useStore(featureFlagStore, store => store.enabled);
  return (
    <div className="devtools-flags">
      {FLAG_IDS.map(id => (
        <label key={id} className="devtools-flag" title={FLAGS[id].description}>
          <input type="checkbox" checked={enabled[id]} onChange={event => featureFlagStore.getState().set(id, event.target.checked)} />
          {FLAGS[id].label}
        </label>
      ))}
    </div>
  );
}
