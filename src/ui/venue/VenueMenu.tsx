import { INGREDIENT_FAMILIES, isVenue, menuOf, menuSlotsOf, stockOfIngredient, venueTypeOf, type IngredientFamily, type ItemId } from '../../core';
import { itemName } from '../../i18n/itemName';
import { t } from '../../i18n/t';
import { gameStore } from '../../store/gameStore';
import { ActionButton } from '../common/ActionButton';
import { useGame } from '../common/hooks';
import { Icon } from '../common/Icon';

interface VenueMenuProps {
  venueId: number;
}

const FAMILIES = Object.keys(INGREDIENT_FAMILIES) as IngredientFamily[];

// The ingredients a Restaurant serves, within the slots of its Tier.
export function VenueMenu({ venueId }: VenueMenuProps) {
  const building = useGame(store => store.state.buildings.find(candidate => candidate.id === venueId));
  const storage = useGame(store => store.state.storage);
  if (!building || !isVenue(building) || venueTypeOf(building) !== 'restaurant') return null;
  const { send } = gameStore.getState();
  const menu = menuOf(building.venue);
  const slots = menuSlotsOf(building.tier);
  const toggle = (item: ItemId) => send({ type: 'SetMenu', buildingId: venueId, menu: menu.includes(item) ? menu.filter(chosen => chosen !== item) : [...menu, item] });
  return (
    <section className="venue-build" aria-label={t('venue.menu')}>
      <p className="note note--muted">{t('venue.menuHint')}</p>
      <p>
        <strong>{t('venue.menu')}</strong>: {menu.length} / {slots}
      </p>
      {menu.length === 0 ? <p className="note note--warn">{t('venue.menuEmpty')}</p> : null}
      <hr/>
      {FAMILIES.map(family => (
          <>
        <div key={family} className="venue-build__items">
          <strong><u>{t(`venue.family.${family}`)}</u></strong>
          {INGREDIENT_FAMILIES[family].map(item => {
            const chosen = menu.includes(item);
            const stock = stockOfIngredient(storage, item);
            return (
              <div key={item} className={chosen ? 'venue-staff venue-staff--chosen' : 'venue-staff'}>
                <div className="venue-staff__label">
                  <strong>{itemName(item)}</strong>
                  <span className="note note--muted">{stock > 0 ? `${stock} ${t('venue.inStorage')}` : t('venue.menuOutOfStock')}</span>
                </div>
                <div className="venue-staff__actions">
                  <ActionButton
                    variant={chosen ? 'success' : 'default'}
                    aria-label={`${chosen ? t('venue.menuRemove') : t('venue.menuAdd')} ${itemName(item)}`}
                    disabled={!chosen && menu.length >= slots}
                    onClick={() => toggle(item)}
                  >
                    <Icon name={chosen ? 'check' : 'book'} />
                  </ActionButton>
                </div>
              </div>
            );
          }
          )}
        </div>
              <hr/>
          </>
      ))}
    </section>
  );
}
