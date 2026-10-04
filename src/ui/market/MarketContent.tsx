import { GOODS, marketQuote, type GoodId } from '../../core';
import { t } from '../../i18n/t';
import { itemName } from '../../i18n/itemName';
import { gameStore } from '../../store/gameStore';
import { useGame, useUi } from '../common/hooks';
import { ActionButton } from '../common/ActionButton';
import { ButtonRow } from '../common/ButtonRow';
import { PanelHeader } from '../common/PanelHeader';

export function MarketContent() {
  const toggle = useUi((store) => store.toggleMarket);
  const state = useGame((store) => store.state);
  const goods = (Object.keys(GOODS) as GoodId[]).filter((good) => (state.storage.goods[good] ?? 0) > 0);
  const send = gameStore.getState().send;

  return (
    <>
      <PanelHeader title={t('market.title')} onClose={toggle} />
      {goods.length === 0 ? <p>{t('market.empty')}</p> : null}
      <ul className="market-list">
        {goods.map((good) => {
          const amount = state.storage.goods[good] ?? 0;
          const one = marketQuote(state, good, 1, state.lastSeen).total;
          const all = marketQuote(state, good, amount, state.lastSeen).total;
          return (
            <li key={good} className="market-row">
              <div>
                <strong>
                  {itemName(good)} × {amount}
                </strong>
                <div className="market-price">
                  {t('market.price')}: {one}
                </div>
              </div>
              <ButtonRow align="stretch" spaced>
                <ActionButton onClick={() => send({ type: 'SellToMarket', good, quantity: 1 })}>
                  {t('market.sellOne')} (+{one})
                </ActionButton>
                <ActionButton onClick={() => send({ type: 'SellToMarket', good, quantity: amount })}>
                  {t('market.sellAll')} (+{all})
                </ActionButton>
              </ButtonRow>
            </li>
          );
        })}
      </ul>
    </>
  );
}
