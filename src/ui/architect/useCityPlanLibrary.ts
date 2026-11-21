import { housePlansOf } from '../../core';
import type { PlanLibrary } from '../../architect/planLibrary';
import { gameStore } from '../../store/gameStore';
import { useGame } from '../common/hooks';

// The plans of the city, saved with it.
export function useCityPlanLibrary(): PlanLibrary {
  const saved = useGame(store => store.state.housePlans);
  const plans = housePlansOf({ housePlans: saved });
  const usage = useGame(store => store.state.buildings.reduce((counts, building) => (building.design?.planId === undefined ? counts : `${counts}${building.design.planId},`), ''));
  const send = gameStore.getState().send;
  return {
    houseCount: (name) => {
      const id = plans.find((saved) => saved.name === name)?.id;
      return usage.split(',').filter((planId) => planId === String(id)).length;
    },
    names: plans.map(({ name }) => name),
    load: (name) => plans.find((saved) => saved.name === name)?.plan,
    save: (name, plan) => send({ type: 'SaveHousePlan', name, plan }),
    remove: (name) => {
      const saved = plans.find((candidate) => candidate.name === name);
      if (saved) send({ type: 'DeleteHousePlan', id: saved.id });
    },
  };
}
