import type { GameState } from '../../core';
import type { ChainStep } from '../../codex/productionChains';
import { t } from '../../i18n/t';
import { ProductionChainBuildingIcon } from './ProductionChainBuildingIcon';
import { ProductionChainItem } from './ProductionChainItem';

interface ProductionChainStepProps {
  step: ChainStep;
  state: GameState;
}

export function ProductionChainStep({ step, state }: ProductionChainStepProps) {
  const built = state.buildings.filter((building) => building.type === step.building).length;
  return (
    <li className="codex-chain-step" data-kind="building">
      <ProductionChainBuildingIcon building={step.building} />
      <span className="codex-chain-building">→ {t(`building.${step.building}`)}</span>
      <small>{built > 0 ? `×${built}` : t('codex.chains.notBuilt')}</small>
      <ul>
        {step.outputs.map((output) => <ProductionChainItem key={output.item} chain={output} state={state} />)}
      </ul>
    </li>
  );
}
