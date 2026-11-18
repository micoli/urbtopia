import { useStore } from 'zustand';
import { prefsStore } from '../../i18n/prefsStore';
import { accessSelectionKey, buildingSelectionKey, selectionExpansionStore } from '../../store/selectionExpansionStore';
import { useSelectedAccess } from '../buildings/useSelectedAccess';
import { useSelectedBuilding } from '../buildings/useSelectedBuilding';

interface SelectionExpansion {
  hasSelection: boolean;
  expanded: boolean;
  expand: () => void;
}

// A selection opens its panel at once with the auto-open preference, and otherwise only after a tap on the mini bar or a double tap on the selection.
export function useSelectionExpansion(): SelectionExpansion {
  const building = useSelectedBuilding();
  const access = useSelectedAccess();
  const autoOpenSelection = useStore(prefsStore, (store) => store.autoOpenSelection);
  const expandedKey = useStore(selectionExpansionStore, (store) => store.expandedKey);
  const key = building ? buildingSelectionKey(building.id) : access ? accessSelectionKey(access.tile) : null;
  return {
    hasSelection: key !== null,
    expanded: autoOpenSelection || (key !== null && expandedKey === key),
    expand: () => {
      if (key !== null) selectionExpansionStore.getState().expand(key);
    },
  };
}
