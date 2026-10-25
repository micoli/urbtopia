import type { SaleChannel } from '../../codex/productionChains';
import { t } from '../../i18n/t';

interface ProductionChainChannelsProps {
  channels: readonly SaleChannel[];
  isGood: boolean;
}

function labelOf(channel: SaleChannel): string {
  if (channel.kind === 'market') return t('codex.chains.market');
  if (channel.kind === 'supermarket') return t('building.supermarket');
  const name = t(`building.${channel.building}`);
  const tier = channel.fromTier > 1 ? ` (${t('home.tier')} ${channel.fromTier}+)` : '';
  return channel.kind === 'counter' ? `${name} · ${t('shop.counter')}${tier}` : `${name}${tier}`;
}

export function ProductionChainChannels({ channels, isGood }: ProductionChainChannelsProps) {
  if (!isGood) return null;
  return <small className="codex-chain-sold" data-kind="sale">{t('codex.chains.soldAt')} {channels.map(labelOf).join(' · ')}</small>;
}
