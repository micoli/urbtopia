import { isHomeType, isRepeatable, maxCopies, nextCopyCost, ownedCopies, buildLimitReached, type BuildingType, type ColorVariant } from '../../core';
import { t } from '../../i18n/t';
import { FlyoutItem } from '../layout/FlyoutItem';
import { useGame, useUi } from '../common/hooks';
import { UrbsAmount } from '../common/UrbsAmount';
import { guideOf } from '../tutorial/tutorialGuide';

interface BuildTypeItemProps {
  type: BuildingType;
  homeColor: ColorVariant;
  preview: string | undefined;
}

export function BuildTypeItem({ type, homeColor, preview }: BuildTypeItemProps) {
  const state = useGame(store => store.state);
  const chooseTool = useUi(store => store.chooseTool);
  const openCodex = useUi(store => store.openCodex);
  const guide = guideOf(state.tutorial);
  return (
    <FlyoutItem
      label={t(`building.${type}`)}
      badge={isRepeatable(type) ? `${ownedCopies(state, type)}/${maxCopies(type)}` : undefined}
      disabled={buildLimitReached(state, type)}
      cost={<UrbsAmount value={nextCopyCost(state, type)} />}
      guided={guide.buildings.includes(type)}
      onChoose={() => chooseTool({ kind: 'building', buildingType: type, ...(isHomeType(type) ? { colorVariant: homeColor } : {}) })}
      codexId={type}
      preview={preview}
      onInfo={() => openCodex(type)}
    />
  );
}
