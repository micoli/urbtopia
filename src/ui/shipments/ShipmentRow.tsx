import { t } from '../../i18n/t';
import type { Shipment } from '../../shipments/types';
import { ActionButton } from '../common/ActionButton';
import { Note } from '../common/Note';
import { SlotList } from '../common/SlotList';
import { LotSummary } from '../social/exchanges/LotSummary';

interface ShipmentRowProps {
  shipment: Shipment;
  direction: 'outgoing' | 'incoming';
  otherCityName: string;
  waitingForRoom: boolean;
  busy: boolean;
  onCancel: () => void;
}

export function ShipmentRow({ shipment, direction, otherCityName, waitingForRoom, busy, onCancel }: ShipmentRowProps) {
  const route = (direction === 'outgoing' ? t('shipments.toCity') : t('shipments.fromCity')).replace('{CITY}', otherCityName);
  return (
    <SlotList.Slot progress={0}>
      <span>
        <LotSummary lot={shipment.lot} /> <small>{route}</small>
        {waitingForRoom && <Note>{t('shipments.waitingForRoom')}</Note>}
      </span>
      {direction === 'outgoing' && (
        <ActionButton disabled={busy} onClick={onCancel}>
          {t('shipments.cancel')}
        </ActionButton>
      )}
    </SlotList.Slot>
  );
}
