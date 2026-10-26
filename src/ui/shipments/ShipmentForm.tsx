import { useState } from 'react';
import { t } from '../../i18n/t';
import { TRADE_LIMITS, type TradeLine } from '../../core';
import type { ShipmentFailure } from '../../shipments/shipmentCoordinator';
import { ActionButton } from '../common/ActionButton';
import { Dropdown } from '../common/Dropdown';
import { Note } from '../common/Note';
import { LotLineRow, type StockLine } from '../social/exchanges/LotLineRow';
import { shipmentFailureMessage } from './shipmentFailureMessage';

export interface DestinationCity {
  id: string;
  name: string;
}

interface ShipmentFormProps {
  destinations: DestinationCity[];
  stock: StockLine[];
  busy: boolean;
  online: boolean;
  failure: ShipmentFailure | null;
  onSubmit: (toCityId: string, lot: TradeLine[]) => Promise<boolean>;
}

const firstLine = (stock: StockLine[]): TradeLine[] => (stock[0] ? [{ item: stock[0].item, quantity: 1 }] : []);

export function ShipmentForm({ destinations, stock, busy, online, failure, onSubmit }: ShipmentFormProps) {
  const [cityId, setCityId] = useState(destinations[0]?.id ?? '');
  const [lines, setLines] = useState<TradeLine[]>(() => firstLine(stock));
  const availableOf = (item: string) => stock.find((line) => line.item === item)?.quantity ?? 0;
  const freeChoices = (current: string) => stock.filter((line) => line.item === current || !lines.some((used) => used.item === line.item));
  const unused = stock.filter((line) => !lines.some((used) => used.item === line.item));
  const linesValid = lines.length > 0 && lines.every((line) => Number.isInteger(line.quantity) && line.quantity >= 1 && line.quantity <= Math.min(availableOf(line.item), TRADE_LIMITS.maxQuantity));
  const canSend = online && !busy && cityId !== '' && linesValid;
  const update = (index: number, change: Partial<TradeLine>) => setLines(lines.map((line, i) => (i === index ? { ...line, ...change } : line)));

  return (
    <form
      className="exchange-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSend) return;
        void onSubmit(cityId, lines).then((sent) => sent && setLines(firstLine(stock)));
      }}
    >
      <div className="exchange-field">
        <span>{t('shipments.to')}</span>
        <Dropdown label={t('shipments.to')} value={cityId} options={destinations.map((city) => ({ value: city.id, label: city.name }))} onChange={setCityId} />
      </div>
      {lines.map((line, index) => (
        <LotLineRow
          key={line.item}
          item={line.item}
          quantity={line.quantity}
          choices={freeChoices(line.item)}
          available={availableOf(line.item)}
          onItem={(item) => update(index, { item, quantity: 1 })}
          onQuantity={(quantity) => update(index, { quantity })}
          onRemove={() => setLines(lines.filter((_, i) => i !== index))}
        />
      ))}
      <ActionButton disabled={lines.length >= TRADE_LIMITS.maxLines || unused.length === 0} onClick={() => setLines([...lines, { item: unused[0]!.item, quantity: 1 }])}>
        {t('exchanges.addItem')}
      </ActionButton>
      <ActionButton type="submit" variant="primary" disabled={!canSend}>
        {busy ? t('shipments.sending') : t('shipments.send')}
      </ActionButton>
      {!online && <Note tone="muted">{t('shipments.offline')}</Note>}
      {failure && <Note>{shipmentFailureMessage(failure)}</Note>}
    </form>
  );
}
