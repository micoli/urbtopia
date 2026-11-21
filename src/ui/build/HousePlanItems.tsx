import { designCostOf, housePlanTypeOf, type BuildingType } from '../../core';
import { t } from '../../i18n/t';
import { useFeatureFlag } from '../../featureFlags/useFeatureFlag';
import { useGame, useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import { FlyoutItem } from '../layout/FlyoutItem';

// The plans drawn in an Architect office, built like any Home.
export function HousePlanItems() {
  const plans = useGame(store => store.state.housePlans);
  const chooseTool = useUi(store => store.chooseTool);
  const enabled = useFeatureFlag('architect');
  if (!enabled || !plans?.length) return null;
  return (
    <>
      <h4 className="build-category">{t('architect.build.plans')}</h4>
      {plans.map(({ id, name, plan }) => {
        const design = { name, plan, planId: id };
        return (
          <FlyoutItem
            key={id}
            label={name}
            cost={<UrbsAmount value={designCostOf(design)} />}
            onChoose={() => chooseTool({ kind: 'building', buildingType: housePlanTypeOf(plan) as BuildingType, design })}
          />
        );
      })}
    </>
  );
}
