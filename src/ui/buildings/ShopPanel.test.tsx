import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBuilding, newGame, type GameState } from '../../core';
import { prefsStore } from '../../i18n/prefsStore';
import { t } from '../../i18n/t';
import { ShopPanel } from './ShopPanel';

const context = vi.hoisted(() => ({ state: null as GameState | null }));
vi.mock('../common/hooks', () => ({
  useGame: (selector: (store: { state: GameState }) => unknown) => selector({ state: context.state! }),
}));

vi.mock('../../store/gameStore', () => ({ gameStore: { getState: () => ({ send: () => {} }) } }));

vi.mock('../common/DrawerPanel', () => ({
  DrawerPanel: Object.assign(({ children }: { children?: React.ReactNode }) => <div>{children}</div>, {
    LabelValue: ({ label, value }: { label: string; value: React.ReactNode }) => <p>{label}: {value}</p>,
    Upgrade: () => <p>upgrade</p>,
  }),
}));

afterEach(() => prefsStore.getState().setLanguage('en'));

const render = (type: 'shopConstruction' | 'shopFood' | 'shop', goods: Record<string, number> = {}) => {
  const building = createBuilding(900, type, 62, 66, 0);
  context.state = { ...newGame({ seed: 'shop-panel', now: 0 }), buildings: [building], storage: { materials: {}, goods } };
  return renderToStaticMarkup(<ShopPanel building={building} />).replaceAll('&#x27;', "'");
};

describe('ShopPanel', () => {
  it.each(['en', 'fr'] as const)('shows the category, the Goods sold and the next Tier in %s', language => {
    prefsStore.getState().setLanguage(language);
    const html = render('shopConstruction');
    expect(html).toContain(t('goodCategory.construction'));
    expect(html).toContain(t('item.planks'));
    expect(html).toContain(t('shop.nextTier'));
    expect(html).toContain(t('item.tiles'));
  });

  it('offers to stock only the Goods the Shop can sell', () => {
    const html = render('shopConstruction', { planks: 10, tools: 10 });
    expect(html).toContain(`+ 5 ${t('item.planks')}`);
    expect(html).not.toContain(`+ 5 ${t('item.tools')}`);
  });

  it('names packed Crops for a Food shop', () => {
    expect(render('shopFood')).toContain(t('shop.packs'));
    expect(render('shopConstruction')).not.toContain(t('shop.packs'));
  });

  it('prices an extra Slot with the General shop premium', () => {
    const general = render('shop');
    const specialised = render('shopConstruction');
    const price = (html: string) => Number(/urbs-amount">(\d+)/.exec(html)?.[1]);
    expect(general).toContain(t('panel.buySlot'));
    expect(price(general)).toBeGreaterThan(0);
    expect(price(general)).toBe(2 * price(specialised));
  });
});
